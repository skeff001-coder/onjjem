"use strict";

const { execSync } = require("child_process");
const https = require("https");
const crypto = require("crypto");
const fs = require("fs");

const KEY_ID = "LKZCCH49F7";
const ISSUER_ID = "48a98d11-f9f9-4c66-ac96-a4834a146201";
const BUNDLE_ID = "com.onjjem.photorestoration";
const APPLE_TEAM_ID = "J6N9GAHK44";
const P8_KEY_PATH = "/tmp/asc_key.p8";
const P12_PASSWORD = "onjjem2026";

const p8Key = fs.readFileSync(P8_KEY_PATH, "utf8").trim();

function createJWT() {
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: "appstoreconnect-v1"
  })).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("SHA256");
  sign.update(signingInput);
  const signature = sign.sign({ key: p8Key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${signingInput}.${signature}`;
}

function apiRequest(method, path, body, jwt) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.appstoreconnect.apple.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log("\n=== Step 1: Generate RSA private key ===");
  execSync("openssl genrsa -out /tmp/dist_key.pem 2048", { stdio: "inherit" });

  console.log("\n=== Step 2: Generate CSR ===");
  execSync(
    `openssl req -new -key /tmp/dist_key.pem -out /tmp/dist_csr.pem -subj "/CN=iPhone Distribution: ONJJEM/OU=${APPLE_TEAM_ID}/O=ONJJEM/C=GB"`,
    { stdio: "inherit" }
  );
  const csrContent = execSync("openssl req -in /tmp/dist_csr.pem -outform DER | base64 | tr -d '\\n'").toString().trim();
  console.log(`CSR length: ${csrContent.length} chars`);

  console.log("\n=== Step 3: Create Distribution Certificate ===");
  let jwt = createJWT();
  const certResp = await apiRequest("POST", "/v1/certificates", {
    data: {
      type: "certificates",
      attributes: { certificateType: "IOS_DISTRIBUTION", csrContent },
    },
  }, jwt);

  if (certResp.status !== 201) {
    console.error("Certificate creation failed:", JSON.stringify(certResp.body, null, 2));
    process.exit(1);
  }
  const certId = certResp.body.data.id;
  const certContent = certResp.body.data.attributes.certificateContent;
  console.log(`Certificate created: ${certId}`);

  fs.writeFileSync("/tmp/dist_cert.der", Buffer.from(certContent, "base64"));
  execSync("openssl x509 -inform DER -in /tmp/dist_cert.der -out /tmp/dist_cert.pem");

  console.log("\n=== Step 4: Create P12 ===");
  execSync(
    `openssl pkcs12 -export -legacy -out /tmp/dist_cert.p12 -inkey /tmp/dist_key.pem -in /tmp/dist_cert.pem -passout pass:${P12_PASSWORD}`,
    { stdio: "inherit" }
  );
  console.log("P12 created");

  console.log("\n=== Step 5: Look up Bundle ID ===");
  jwt = createJWT();
  const bundleResp = await apiRequest("GET", `/v1/bundleIds?filter[identifier]=${BUNDLE_ID}&filter[platform]=IOS`, null, jwt);

  let bundleIdId;
  if (bundleResp.status === 200 && bundleResp.body.data && bundleResp.body.data.length > 0) {
    bundleIdId = bundleResp.body.data[0].id;
    console.log(`Found Bundle ID record: ${bundleIdId}`);
  } else {
    console.log("Bundle ID not found in API — creating...");
    jwt = createJWT();
    const createBundleResp = await apiRequest("POST", "/v1/bundleIds", {
      data: {
        type: "bundleIds",
        attributes: { identifier: BUNDLE_ID, name: "ONJJEM Photo Restoration", platform: "IOS" },
      },
    }, jwt);
    if (createBundleResp.status !== 201) {
      console.error("Bundle ID creation failed:", JSON.stringify(createBundleResp.body, null, 2));
      process.exit(1);
    }
    bundleIdId = createBundleResp.body.data.id;
    console.log(`Created Bundle ID record: ${bundleIdId}`);
  }

  console.log("\n=== Step 6: Create Provisioning Profile ===");
  jwt = createJWT();
  const profileResp = await apiRequest("POST", "/v1/profiles", {
    data: {
      type: "profiles",
      attributes: { name: "ONJJEM AppStore Distribution", profileType: "IOS_APP_STORE" },
      relationships: {
        bundleId: { data: { type: "bundleIds", id: bundleIdId } },
        certificates: { data: [{ type: "certificates", id: certId }] },
        devices: { data: [] },
      },
    },
  }, jwt);

  if (profileResp.status !== 201) {
    console.error("Profile creation failed:", JSON.stringify(profileResp.body, null, 2));
    process.exit(1);
  }
  const profileContent = profileResp.body.data.attributes.profileContent;
  console.log(`Provisioning Profile created: ${profileResp.body.data.id}`);

  console.log("\n=== Step 7: Save credentials ===");
  fs.copyFileSync("/tmp/dist_cert.p12", "artifacts/owens-photofix/certs/dist_cert.p12");
  fs.writeFileSync("artifacts/owens-photofix/certs/dist_profile.mobileprovision", Buffer.from(profileContent, "base64"));

  const credentials = {
    ios: {
      distributionCertificate: {
        path: "certs/dist_cert.p12",
        password: P12_PASSWORD,
      },
      provisioningProfilePath: "certs/dist_profile.mobileprovision",
    },
  };
  fs.writeFileSync("artifacts/owens-photofix/credentials.json", JSON.stringify(credentials, null, 2));

  console.log("\n✅ Credentials ready!");
  console.log("  P12:     artifacts/owens-photofix/certs/dist_cert.p12");
  console.log("  Profile: artifacts/owens-photofix/certs/dist_profile.mobileprovision");
  console.log("  Creds:   artifacts/owens-photofix/credentials.json");
}

main().catch((err) => { console.error(err); process.exit(1); });
