<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ONJJEM - Personalised Photo Gifts</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;700&family=Poppins:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: linear-gradient(180deg, #1A0F2E 0%, #120A22 45%, #0D0719 100%);
    color: #F3EAFF;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 40px 20px 80px;
  }
  .wrap { max-width: 1000px; margin: 0 auto; }
  .hero {
    text-align: center;
    margin-bottom: 48px;
    position: relative;
    padding: 44px 20px 24px;
    border-radius: 24px;
    background: radial-gradient(ellipse 70% 60% at 50% 15%, rgba(212,168,67,0.14) 0%, rgba(212,168,67,0.05) 40%, transparent 75%),
                radial-gradient(ellipse 60% 50% at 20% 60%, rgba(126,90,211,0.18) 0%, transparent 70%),
                radial-gradient(ellipse 60% 50% at 80% 60%, rgba(90,60,160,0.2) 0%, transparent 70%);
  }
  h1 {
    font-family: 'Comfortaa', sans-serif;
    font-weight: 700;
    font-size: clamp(48px, 12vw, 84px);
    letter-spacing: 6px;
    margin-bottom: 26px;
    background: linear-gradient(180deg,
      #FDF6E8 0%,
      #F3E2BC 15%,
      #E8CE96 30%,
      #DCB877 50%,
      #C9A05E 70%,
      #DCB877 85%,
      #F3E2BC 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-stroke: 2px #6B4E2A;
    text-shadow:
      0 1px 0 #B8905A,
      0 2px 0 #A98450,
      0 3px 0 #9A7846,
      0 4px 0 #8B6C3C,
      0 5px 0 #7C6032,
      0 6px 0 #6D5428,
      0 7px 0 #5E481E,
      0 8px 0 #4F3C14,
      0 9px 2px rgba(0,0,0,0.5);
    animation: shine 4s ease-in-out infinite;
  }
  @keyframes shine {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.15); }
  }
    .acronym-line {
    color: #D4B14A;
    font-size: clamp(11px, 2vw, 13px);
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .acronym-line .initial { font-weight: 800; color: #F3E2BC; }
  .three-words {
    display: flex;
    justify-content: center;
    gap: 14px;

    margin-top: 8px;
    margin-bottom: 24px;
  }
  .three-words span {
    color: #D4B14A;
    font-size: clamp(13px, 2.2vw, 16px);
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .three-words .dot { color: #D4B14A; opacity: 0.5; }
  .tagline { color: #E8D9A8; font-size: 18px; margin-bottom: 14px; }
  .subtagline { color: rgba(243,234,255,0.55); font-size: 14px; margin-bottom: 40px; }
  .intro-text {
    max-width: 640px;
    margin: 0 auto;
    color: rgba(243,234,255,0.78);
    font-size: 15px;
    line-height: 1.8;
  }
  .shipping-note {
    max-width: 640px;
    margin: 14px auto 0;
    color: #D4B14A;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
  }

  .ticker-wrap {
    margin: 28px auto 0;
    max-width: 100%;
    overflow: hidden;
    border-top: 1px solid rgba(212,168,67,0.25);
    border-bottom: 1px solid rgba(212,168,67,0.25);
    padding: 12px 0;
  }
  .ticker-track {
    display: flex;
    width: max-content;
    gap: 40px;
    animation: tickerScroll 38s linear infinite;
  }
  .ticker-track span {
    color: #D4B14A;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    white-space: nowrap;
    opacity: 0.85;
  }
  @keyframes tickerScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .print-quality-note {
    text-align: center;
    color: rgba(243,234,255,0.45);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3px;
    margin-top: 12px;
  }

  .why-section {
    max-width: 700px;
    margin: 32px auto 0;
    background: #FFFFFF;
    border: 1px solid rgba(27,111,168,0.25);
    box-shadow: 0 4px 20px rgba(27,111,168,0.08);
    border-radius: 14px;
    padding: 32px 28px;
    text-align: left;
  }
  .why-section h2 {
    color: #1B6FA8;
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 14px;
    text-align: center;
  }
  .why-section p {
    color: rgba(43,58,74,0.85);
    font-size: 15px;
    line-height: 1.8;
  }

  .reviews-section { max-width: 900px; margin: 40px auto 0; }
  .reviews-title { color: #1B6FA8; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 6px; }
  .reviews-sub { text-align: center; color: rgba(43,58,74,0.55); font-size: 13px; margin-bottom: 20px; }
  .reviews-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  .review-card {
    background: #FFFFFF;
    border: 1px solid rgba(27,111,168,0.18);
    box-shadow: 0 2px 12px rgba(27,111,168,0.06);
    border-radius: 12px;
    padding: 18px;
    text-align: left;
  }
  .review-stars { color: #F5A623; font-size: 15px; letter-spacing: 2px; margin-bottom: 8px; }
  .review-product { color: #1B6FA8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .review-text { color: rgba(43,58,74,0.8); font-size: 13px; line-height: 1.6; font-style: italic; margin-bottom: 10px; }
  .review-name { color: #2B3A4A; font-size: 12px; font-weight: 700; }

  .ideas-section {
    max-width: 800px;
    margin: 24px auto 0;
  }
  .ideas-title {
    color: #1B6FA8;
    font-size: 20px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 16px;
  }
  .ideas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .idea-card {
    background: #FFFFFF;
    border: 1px solid rgba(27,111,168,0.2);
    box-shadow: 0 2px 10px rgba(27,111,168,0.06);
    border-radius: 12px;
    padding: 20px;
    text-align: left;
  }
  .idea-card .emoji { font-size: 26px; margin-bottom: 8px; display: block; }
  .idea-card h3 { color: #1B6FA8; font-size: 15px; margin-bottom: 6px; }
  .idea-card p { color: rgba(43,58,74,0.7); font-size: 13px; line-height: 1.6; }
  .idea-card.pressable {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    border: 1px solid rgba(212,168,67,0.4);
  }
  .idea-card.pressable:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(212,168,67,0.2);
  }
  .idea-card.pressable:active { transform: translateY(-1px); }
  .idea-card .cta {
    display: inline-block;
    margin-top: 10px;
    color: #B8892A;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.3px;
  }

  /* Category nav bar */
  .cat-nav-wrap {
    position: sticky;
    top: 0;
    background: linear-gradient(180deg, #1A0F2E 0%, #150C28 60%, rgba(21,12,40,0.97) 100%);
    padding: 20px 0 16px;
    margin-top: 40px;
    z-index: 10;
    border-bottom: 1px solid rgba(212,168,67,0.2);
  }
  .cat-nav {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .cat-nav::-webkit-scrollbar { display: none; }
  .cat-btn {
    flex-shrink: 0;
    background: #FFFFFF;
    color: #1B6FA8;
    border: 1px solid rgba(27,111,168,0.25);
    border-radius: 50px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .cat-btn.active {
    background: linear-gradient(135deg,#1B6FA8,#3E9BD6,#7FC4EF,#1B6FA8);
    color: #FFFFFF;
    border-color: transparent;
  }

  /* Products */
  .section-title {
    color: #1B6FA8;
    font-size: 24px;
    font-weight: 800;
    margin: 32px 0 20px;
    text-align: center;
  }
  .category-intro {
    max-width: 640px;
    margin: -8px auto 24px;
    color: rgba(43,58,74,0.7);
    font-size: 14px;
    line-height: 1.6;
    text-align: center;
    background: #FFF8E8;
    border: 1px solid rgba(245,166,35,0.25);
    border-radius: 12px;
    padding: 14px 18px;
  }
  .category-intro .app-link {
    display: inline-block;
    font-weight: 800;
    font-size: 15px;
    color: #FFFFFF;
    background: #F5A623;
    padding: 2px 10px;
    border-radius: 6px;
    text-decoration: none;
  }
  .category-intro .app-link:active {
    opacity: 0.85;
  }
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  .card {
    background: #FFFFFF;
    border: 1px solid rgba(27,111,168,0.18);
    box-shadow: 0 2px 12px rgba(27,111,168,0.06);
    border-radius: 12px;
    overflow: hidden;
  }
  .card img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    display: block;
    background: linear-gradient(180deg, #EAF6FF 0%, #FFFFFF 40%);
  }
  .card-body { padding: 16px; }
  .card h3 { color: #2B3A4A; font-size: 16px; margin-bottom: 4px; }
  .card p.price-range { color: #1B6FA8; font-size: 14px; font-weight: 700; margin-bottom: 10px; }
  .card p.pp-note { color: rgba(43,58,74,0.55); font-size: 12px; margin-bottom: 12px; margin-top: -6px; }
  .card p.desc { color: rgba(43,58,74,0.6); font-size: 13px; margin-bottom: 14px; line-height: 1.5; }
  select.variant-select {
    width: 100%;
    background: #F4FAFF;
    color: #2B3A4A;
    border: 1px solid rgba(27,111,168,0.3);
    border-radius: 8px;
    padding: 10px;
    font-size: 13px;
    margin-bottom: 10px;
  }
  input[type=file] {
    width: 100%;
    font-size: 12px;
    color: #F5D78E;
    margin-bottom: 10px;
  }
  .buy-btn {
    display: block;
    width: 100%;
    background: linear-gradient(135deg,#1B6FA8,#3E9BD6,#7FC4EF,#1B6FA8);
    color: #FFFFFF;
    font-weight: 700;
    font-size: 14px;
    padding: 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
  }
  .buy-btn:disabled { opacity: 0.6; }
  .status { font-size: 12px; margin-top: 8px; text-align: center; min-height: 16px; }
  .status.error { color: #ff8080; }
  .status.loading { color: #1B6FA8; }

  .cartoon-toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0;
    padding: 10px 12px;
    background: rgba(212,168,67,0.08);
    border: 1px solid rgba(212,168,67,0.25);
    border-radius: 10px;
  }
  .cartoon-toggle-row input[type="checkbox"] { width: 18px; height: 18px; flex-shrink: 0; }
  .cartoon-toggle-row label { font-size: 13px; color: #3a2f1a; cursor: pointer; }

  .cartoon-preview-overlay {
    position: fixed;
    inset: 0;
    background: rgba(13,7,25,0.92);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .cartoon-preview-card {
    background: linear-gradient(180deg, #1A0F2E 0%, #120A22 100%);
    border: 1px solid rgba(212,168,67,0.35);
    border-radius: 20px;
    padding: 28px 24px;
    max-width: 420px;
    width: 100%;
    text-align: center;
  }
  .cartoon-preview-title {
    font-family: 'Comfortaa', sans-serif;
    font-weight: 700;
    font-size: 19px;
    color: #F3E2BC;
    margin-bottom: 16px;
  }
  .cartoon-preview-img {
    width: 100%;
    border-radius: 12px;
    margin-bottom: 18px;
    background: #0D0715;
    min-height: 200px;
    object-fit: contain;
  }
  .cartoon-preview-loading {
    color: rgba(243,234,255,0.7);
    font-size: 14px;
    padding: 60px 0;
  }
  .cartoon-preview-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .cartoon-btn-primary {
    background: #D4B14A;
    color: #1A0F2E;
    border: none;
    border-radius: 999px;
    padding: 12px 24px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    flex: 1;
    min-width: 140px;
  }
  .cartoon-btn-secondary {
    background: transparent;
    color: rgba(243,234,255,0.7);
    border: 1px solid rgba(243,234,255,0.3);
    border-radius: 999px;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    flex: 1;
    min-width: 100px;
  }

  footer { text-align: center; margin-top: 50px; }
  footer a { color: #1B6FA8; text-decoration: none; margin: 0 10px; font-size: 13px; }

  .wrap, .cat-nav-wrap { position: relative; z-index: 1; }

  .thankyou-overlay {
    position: fixed;
    inset: 0;
    background: rgba(13,7,25,0.92);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .thankyou-card {
    background: linear-gradient(180deg, #1A0F2E 0%, #120A22 100%);
    border: 1px solid rgba(212,168,67,0.35);
    border-radius: 20px;
    padding: 40px 28px;
    max-width: 420px;
    text-align: center;
  }
  .thankyou-check {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(96,200,140,0.15);
    border: 2px solid #60C88C;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 32px;
  }
  .thankyou-title {
    font-family: 'Comfortaa', sans-serif;
    font-weight: 700;
    font-size: 22px;
    color: #F3E2BC;
    margin-bottom: 12px;
  }
  .thankyou-body {
    color: rgba(243,234,255,0.8);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 24px;
  }
  .thankyou-close {
    background: #D4B14A;
    color: #1A0F2E;
    border: none;
    border-radius: 999px;
    padding: 12px 32px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="wrap">

    <div class="hero">
    <h1>ONJJEM</h1>
      <div class="acronym-line">
        <span class="initial">O</span>riginal · <span class="initial">N</span>ostalgic · <span class="initial">J</span>oyful <span class="initial">J</span>ournals of <span class="initial">E</span>verlasting <span class="initial">M</span>emories
      </div>

      <div class="three-words">
        <span>Send</span><span class="dot">•</span><span>We Create</span><span class="dot">•</span><span>You Receive</span>
      </div>
      <p class="tagline">Handcrafted Gifts, Made From Your Memories</p>
      <p class="subtagline">Made in Britain &nbsp;|&nbsp; Delivered to Your Door</p>
      <p class="intro-text">
        Upload any photo and we turn it into a beautiful, personalised gift — canvas prints, magic mugs, jigsaws, photo frames and much more. Every order is made just for you, printed to the highest standard, and delivered straight to your door.
      </p>
      <p class="shipping-note">Free UK delivery included on every order.</p>

      <div class="ticker-wrap">
        <div class="ticker-track">
          <span>Canvas Prints</span><span>Magic Mugs</span><span>Fine Art Prints</span><span>Photo Jigsaws</span><span>Pet Tags</span><span>Wooden Coasters</span><span>Photo Magnets</span><span>Playing Cards</span><span>Tea Towels</span><span>Temporary Tattoos</span><span>Metallic Foil Prints</span><span>Glow Posters</span><span>Framed Posters</span><span>Display Boards</span><span>Budget Posters</span>
          <span>Canvas Prints</span><span>Magic Mugs</span><span>Fine Art Prints</span><span>Photo Jigsaws</span><span>Pet Tags</span><span>Wooden Coasters</span><span>Photo Magnets</span><span>Playing Cards</span><span>Tea Towels</span><span>Temporary Tattoos</span><span>Metallic Foil Prints</span><span>Glow Posters</span><span>Framed Posters</span><span>Display Boards</span><span>Budget Posters</span>
        </div>
      </div>
      <p class="print-quality-note">Printed with professional Giclée &amp; archival-grade printers</p>

    </div>

    <div class="cat-nav-wrap">
      <div class="cat-nav" id="catNav"></div>
    </div>

    <h2 class="section-title" id="sectionTitle">Magic Photo Mug</h2>
    <div class="products" id="products"></div>

    <div class="ideas-section">
      <p class="ideas-title">Gift Inspiration</p>
      <div class="ideas-grid">
        <div class="idea-card pressable" onclick="goToCategory('canvas', 'Eco Rolled Canvas')" role="button" tabindex="0" aria-label="Shop Eco Rolled Canvas">
          <span class="emoji">⚽</span>
          <h3>Sporting Legends</h3>
          <p>Their favourite footballer, athlete or team badge printed onto an unframed rolled canvas — a genuinely thrilling birthday surprise for any young sports fan.</p>
          <span class="cta">From £9.99 — Shop Eco Rolled Canvas →</span>
        </div>
        <div class="idea-card pressable" onclick="goToCategory('canvas', 'Stretched Canvas')" role="button" tabindex="0" aria-label="Shop Stretched Canvas">
          <span class="emoji">🐾</span>
          <h3>For the Pet Lover</h3>
          <p>Not just for family photos — your dog, cat, or any beloved pet can take pride of place on a stretched canvas. A heartfelt gift for anyone who treats their pet like family.</p>
          <span class="cta">From £21.99 — Shop Stretched Canvas →</span>
        </div>
        <div class="idea-card pressable" onclick="goToCategory('canvas', 'Eco Canvas')" role="button" tabindex="0" aria-label="Shop Eco Canvas">
          <span class="emoji">🎂</span>
          <h3>For Any Occasion</h3>
          <p>Birthdays, anniversaries, new babies, or just because — whatever the photo and whoever it's of, we turn it into a gift that feels genuinely personal, not off-the-shelf.</p>
          <span class="cta">From £14.99 — Shop Eco Canvas →</span>
        </div>
      </div>
    </div>

    <div class="reviews-section">
      <p class="reviews-title">What Our Customers Say</p>
      <p class="reviews-sub">Trusted by families across the UK</p>
      <div class="reviews-grid">
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-product">Canvas Print</p>
          <p class="review-text">"Got a canvas of my daughter for my husband and he cried when he opened it. Absolutely beautiful quality."</p>
          <p class="review-name">Claire M, Birmingham</p>
        </div>
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-product">Magic Photo Mug</p>
          <p class="review-text">"Ordered a magic mug with my son's favourite footballer on it. He could not believe it when he opened it — his face was a picture!"</p>
          <p class="review-name">James T, Manchester</p>
        </div>
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-product">Photo Jigsaw</p>
          <p class="review-text">"The jigsaw of our family holiday photo was stunning. Every piece perfect. Arrived so quickly. Brilliant company."</p>
          <p class="review-name">Sarah K, Edinburgh</p>
        </div>
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-product">Framed Photo Tile</p>
          <p class="review-text">"Framed print of my dog arrived beautifully packaged. Far better quality than anything I have ordered online before."</p>
          <p class="review-name">David R, London</p>
        </div>
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-product">Photo Coasters</p>
          <p class="review-text">"Bought these as a housewarming gift and they were such a hit. Lovely quality, arrived really quickly too."</p>
          <p class="review-name">Priya N, Leicester</p>
        </div>
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-product">Photo Magnets</p>
          <p class="review-text">"Ordered a set with photos of our cat and they look brilliant on the fridge. Great value and lovely quality."</p>
          <p class="review-name">Michael O, Bristol</p>
        </div>
      </div>
    </div>

        <div class="why-section" style="margin-top: 40px;">
      <h2>Why Choose ONJJEM</h2>
      <p>At ONJJEM, we don't just print photos — we craft keepsakes. Every single order is treated with the same care and attention we'd want for our own family, because behind every photo is a memory that matters.</p>
      <p style="margin-top: 14px;">Our fine art range is produced using professional Giclée printing — the industry standard for museum-quality reproduction — with archival, pigment-based inks that resist fading for decades, not months. Every material we use is chosen because it lasts: from heavyweight fine art papers to premium ceramic and fade-resistant canvas, nothing is selected because it's the cheapest option available. Our print process is checked at every stage, so the photo you send is the photo you get — true colours, sharp detail, nothing lost in translation.</p>
      <p style="margin-top: 14px;">Our customers are never just an order number to us. From the moment you send your photo to the moment your gift arrives at your door, we're looking after it as if it were our own — because we know what these photos mean. A childhood photo, a pet who's no longer with you, a moment from a wedding day — these aren't just images to us, and we treat every single order with that in mind.</p>
      <p style="margin-top: 14px;">That's the ONJJEM promise: professional-grade printing, honest quality, and a gift you'll be genuinely proud to give.</p>
    </div>


    <footer>
      <a href="/delivery.html">Delivery Info</a>
      <a href="/terms.html">Terms &amp; Conditions</a>
    </footer>
  </div>

<script>
const API_BASE = "https://onjjem-production-5ef8.up.railway.app";

// Each top-level category can contain one or more products, each with its own variants
const CATEGORIES = [
  {
    key: "canvas",
    label: "Canvas & Wall Art",
    items: [
      {
        name: "Stretched Canvas",
        img: "/products/stretched-canvas.webp",
        desc: "Museum-quality canvas, hand-stretched over a solid wooden frame and ready to hang straight out of the box — no additional framing needed. We use fade-resistant inks on premium poly-cotton canvas for rich, true-to-life colour that lasts for years. This is the gift that turns a favourite photo into a genuine piece of wall art, and it's consistently our most gifted item for weddings, new babies, and anniversaries.",
        variants: [
          { sku: "canvas-stretched-a4", label: "A4 - £32.99" },
          { sku: "canvas-stretched-a3", label: "A3 - £40.99" },
          { sku: "canvas-stretched-a2", label: "A2 - £64.99" },
          { sku: "canvas-stretched-a1", label: "A1 - £90.99" },
          { sku: "canvas-stretched-a0", label: "A0 - £120.99" },
        ],
      },
      {
        name: "Eco Canvas",
        img: "/products/eco-canvas.webp",
        desc: "All the beauty of a canvas print at a friendlier price. Printed on high-quality canvas material using an eco-conscious process, this is a brilliant way to fill a wall with photos without spending a fortune — perfect for a gallery wall of family memories, or trying out a photo you love before committing to a larger size.",
        variants: [
          { sku: "eco-canvas-8x12", label: "8x12 inch - £21.99" },
          { sku: "eco-canvas-12x12", label: "12x12 inch - £24.99" },
          { sku: "eco-canvas-12x18", label: "12x18 inch - £28.99" },
          { sku: "eco-canvas-16x16", label: "16x16 inch - £31.99" },
          { sku: "eco-canvas-16x24", label: "16x24 inch - £39.99" },
          { sku: "eco-canvas-20x20", label: "20x20 inch - £39.99" },
          { sku: "eco-canvas-20x30", label: "20x30 inch - £45.99" },
        ],
      },
      {
        name: "Slim Canvas",
        img: "/products/slim-canvas.webp",
        desc: "Not your standard canvas — this uses a slimmer, precision-engineered frame profile for a sleek, contemporary edge instead of the traditional chunky wooden stretcher bars. It's a specialist finish that costs a little more to produce than our regular canvas range, but delivers a genuinely modern, gallery-style look that suits elongated and panoramic shots beautifully. A design-forward choice for anyone who wants their wall art to feel a step above the ordinary.",
        variants: [
          { sku: "slim-canvas-10x14", label: "Small (10x14 inch) - £31.99" },
          { sku: "slim-canvas-12x18", label: "Medium (12x18 inch) - £44.99" },
          { sku: "slim-canvas-8x40", label: "Large (8x40 inch) - £55.99" },
        ],
      },
      {
        name: "Eco Rolled Canvas",
        img: "/products/eco-rolled-canvas.jpg",
        desc: "An unframed, rolled canvas print for anyone who wants to choose or make their own frame — or simply display it as-is. Same fade-resistant inks and premium poly-cotton canvas as our stretched canvas, just shipped flat and ready for you to mount however you like.",
        variants: [
          { sku: "eco-rolled-10x10", label: "10x10 inch - £13.99" },
          { sku: "eco-rolled-10x12", label: "10x12 inch - £13.99" },
          { sku: "eco-rolled-11x14", label: "11x14 inch - £14.99" },
          { sku: "eco-rolled-12x12", label: "12x12 inch - £14.99" },
          { sku: "eco-rolled-12x16", label: "12x16 inch - £14.99" },
          { sku: "eco-rolled-12x18", label: "12x18 inch - £14.99" },
          { sku: "eco-rolled-10x20", label: "10x20 inch - £14.99" },
          { sku: "eco-rolled-12x24", label: "12x24 inch - £17.99" },
        ],
      },
    ],
  },
  {
    key: "specialist-prints",
    label: "Specialist Prints",
    items: [
      {
        name: "Museum-Grade Fine Art Print",
        img: "/products/fine-art-print.svg",
        desc: "Professional Giclée fine art printing on heavyweight 240gsm matte paper with archival, pigment-based inks. Razor-sharp detail and rich colour that resists fading over time — a genuinely premium way to display a favourite photo.",
        variants: [
          { sku: "art-print-5x7", label: "5x7 inch - £13.99" },
          { sku: "art-print-8x10", label: "8x10 inch - £16.99" },
          { sku: "art-print-11x14", label: "11x14 inch - £18.99" },
          { sku: "art-print-12x16", label: "12x16 inch - £20.99" },
          { sku: "art-print-24x32", label: "24x32 inch - £32.99" },
          { sku: "art-print-36x48", label: "36x48 inch - £53.99" },
        ],
      },
      {
        name: "Premium Metallic Foil Art Print",
        img: "/products/metallic-foil-print.webp",
        desc: "Ultra-heavyweight 350gsm specialist print with true metallic Gold or Silver foil accents — direct UV digital printing lets you control exactly which lettering or highlights shine. A genuinely eye-catching statement piece.",
        variants: [
          { sku: "art-foil-a4-gold", label: "A4 / Gold - £16.99" },
          { sku: "art-foil-a4-silver", label: "A4 / Silver - £16.99" },
          { sku: "art-foil-a3-gold", label: "A3 / Gold - £21.99" },
          { sku: "art-foil-a3-silver", label: "A3 / Silver - £21.99" },
          { sku: "art-foil-a2-gold", label: "A2 / Gold - £31.99" },
          { sku: "art-foil-a2-silver", label: "A2 / Silver - £31.99" },
          { sku: "art-foil-a1-gold", label: "A1 / Gold - £47.99" },
          { sku: "art-foil-a1-silver", label: "A1 / Silver - £47.99" },
          { sku: "art-foil-20x28-gold", label: "20x28 inch / Gold - £37.99" },
          { sku: "art-foil-20x28-silver", label: "20x28 inch / Silver - £37.99" },
          { sku: "art-foil-20x30-gold", label: "20x30 inch / Gold - £39.99" },
          { sku: "art-foil-20x30-silver", label: "20x30 inch / Silver - £39.99" },
          { sku: "art-foil-20x40-gold", label: "20x40 inch / Gold - £48.99" },
          { sku: "art-foil-20x40-silver", label: "20x40 inch / Silver - £48.99" },
          { sku: "art-foil-24x24-gold", label: "24x24 inch / Gold - £39.99" },
          { sku: "art-foil-24x24-silver", label: "24x24 inch / Silver - £39.99" },
        ],
      },
      {
        name: "Premium Glow in the Dark Poster",
        img: "/products/glow-poster-premium.webp",
        desc: "Imagine your dog's photo glowing softly on the wall long after the lights go out. Charge it under any bright light for around 30 minutes, then watch it come alive with a captivating luminous glow that lasts for hours in the dark. Printed on ultra-heavyweight 350gsm gallery-style paper for a genuinely premium feel — a magical bedtime keepsake for a bedroom, nursery, or playroom.",
        variants: [
          { sku: "art-gitd-premium-4x6", label: "4x6 inch - £13.99" },
          { sku: "art-gitd-premium-6x6", label: "6x6 inch - £15.99" },
          { sku: "art-gitd-premium-a4", label: "A4 - £16.99" },
          { sku: "art-gitd-premium-a3", label: "A3 - £21.99" },
          { sku: "art-gitd-premium-a2", label: "A2 - £31.99" },
          { sku: "art-gitd-premium-20x24", label: "20x24 inch - £34.99" },
          { sku: "art-gitd-premium-36x48", label: "36x48 inch - £98.99" },
          { sku: "art-gitd-premium-40x60", label: "40x60 inch - £128.99" },
        ],
      },
    ],
  },
  {
    key: "frames",
    label: "Frames & Tiles",
    items: [
      {
        name: "Framed Photo Tiles",
        img: "/products/framed-photo-tiles.jpg",
        desc: "A charming, compact way to display a favourite photo on a shelf, mantelpiece or desk. Each tile comes with its own neat frame and small stand, so it's ready to display the moment it arrives — a lovely little gift on its own, or beautiful grouped together as a set of cherished memories.",
        variants: [
          { sku: "photo-tile-5x7", label: "5x7 inch - £18.99" },
          { sku: "photo-tile-8x8", label: "8x8 inch - £21.99" },
          { sku: "photo-tile-8x10", label: "8x10 inch - £22.99" },
        ],
      },
    ],
  },
  {
    key: "kitchen-magic",
    label: "Kitchen Magic",
    items: [
      {
        name: "Magic Photo Mug",
        img: "/products/IMG_4299.jpeg",
        desc: "This is the mug that stops breakfast in its tracks. It looks completely plain and jet black in the box — then you pour in your hot drink and, like magic, your photo rises up in full, vivid colour right before your eyes. Made from durable ceramic with a heat-sensitive coating, dishwasher safe, and printed to last. There's nothing else quite like the reaction this gift gets when it's opened.",
        variants: [{ sku: "magic-mug", label: "11oz Heat-Activated Mug - £17.99" }],
      },
      {
        name: "Photo Mugs",
        img: "/products/photo-mugs-v2.jpg",
        desc: "A classic that never goes out of style. Your favourite photo, printed in sharp, vivid colour on a premium ceramic mug that's built for daily use. Dishwasher and microwave safe, so it's as practical as it is personal — perfect for the office desk, the morning coffee, or a thoughtful gift that gets used every single day.",
        variants: [
          { sku: "mug-11oz", label: "11oz Mug - £15.99" },
          { sku: "mug-15oz", label: "15oz Large Mug - £21.99" },
        ],
      },
      {
        name: "Photo Coasters",
        img: "/products/wooden-coasters.jpg",
        desc: "Practical, personal, and genuinely useful every single day. Each coaster is printed with your photo and finished with a durable, heat-resistant surface and cork backing to protect furniture properly — not just decorative. A brilliant small gift, housewarming present, or a thoughtful little extra alongside a bigger order.",
        variants: [
          { sku: "coaster-1pk", label: "Single Coaster - £15.99" },
          { sku: "coaster-2pk", label: "Set of 2 - £17.99" },
          { sku: "coaster-4pk", label: "Set of 4 - £24.99" },
          { sku: "coaster-6pk", label: "Set of 6 - £32.99" },
        ],
      },
      {
        name: "Premium Personalised Kitchen Towel",
        img: "/products/tea-towels.jpg",
        desc: "A soft, high-absorbency tea towel featuring your photo in bright, long-lasting print. Choose Polyester for a vibrant all-over print with easy-care fade resistance, or 100% Cotton Twill for extra absorbency and durability. Both are fully machine washable with expertly hemmed edges. Please note: white ink cannot be printed on this item — any transparent or white areas in your design will show the material's natural background tone.",
        variants: [
          { sku: "tea-towel-poly", label: "Polyester - £14.99" },
          { sku: "tea-towel-cotton", label: "Cotton Twill - £18.99" },
        ],
      },
      {
        name: "Photo Magnets",
        img: "/products/photo-magnets.webp",
        desc: "Turn your fridge into a gallery of your favourite moments. Printed on durable, high-gloss magnetic stock with strong holding power, these make a wonderfully simple gift — and an easy way to fit multiple photos and memories somewhere you'll see them every day. Mix and match sizes to build your own little collection.",
        variants: [
          { sku: "magnet-fridge-3x2", label: "Fridge Magnet 3x2 - £12.99" },
          { sku: "magnet-fridge-6x4", label: "Fridge Magnet 6x4 - £13.99" },
          { sku: "magnet-acrylic-2x3", label: "Acrylic Magnet 2x3 - £16.99" },
          { sku: "magnet-square-4x4", label: "Square Magnet 4x4 - £15.99" },
          { sku: "magnet-square-6x6", label: "Square Magnet 6x6 - £18.99" },
        ],
      },
    ],
  },
  {
    key: "kids-corner",
    label: "Jigsaws & Children's Corner",
    intro: "Got a young football fan, dancer, or sports star at home? Send us their favourite player, team badge, or big moment on the pitch — we'll turn it into a puzzle, a deck of cards, or a display board they'll genuinely be proud of. (Psst — if you're after something extra magical, check out our Premium Glow in the Dark Posters over in Specialist Prints, a firm favourite for bedrooms!)",
    items: [
      {
        name: "Photo Jigsaw",
        img: "/products/jigsaw-500pc.webp",
        desc: "There's nothing quite like the magic of building a puzzle where every piece brings you closer to a face you love — a family member, your favourite sports star, or your own dog — revealed piece by piece right in front of you. This isn't just another puzzle: it's a premium, gallery-grade keepsake, proudly printed and handcrafted here in the UK, built from ultra-thick premium paperboard with flawless, borderless dye-sublimation printing for vivid, true-to-life colour. Finished with a mirror-smooth high-gloss varnish and delivered inside a genuine metal keepsake tin — with your photo recreated on the lid — this is the puzzle experience nothing else on the market comes close to.",
        variants: [
          { sku: "jigsaw-30", label: "30 pieces (Pocket Masterpiece) - £24.99" },
          { sku: "jigsaw-110", label: "110 pieces (The Perfect Gift) - £27.99" },
          { sku: "jigsaw-252", label: "252 pieces (The Rainy Day Choice) - £29.99" },
          { sku: "jigsaw-500", label: "500 pieces (The Weekend Challenge) - £34.99" },
          { sku: "jigsaw-1000", label: "1000 pieces (The Ultimate Puzzle) - £37.99" },
        ],
      },
      {
        name: "Playing Cards",
        img: "/products/playing-cards.webp",
        desc: "A full deck of 54 professional-quality playing cards, each one featuring your own photos, printed crisp and vivid on durable, smooth-shuffling card stock. A brilliantly personal twist on a classic — genuinely fun to use at family game nights, and a gift that gets picked up again and again rather than sitting on a shelf.",
        variants: [{ sku: "playing-cards", label: "Full Deck - £21.99" }],
      },
      {
        name: "Everyday Budget Poster",
        img: "/products/budget-poster.svg",
        desc: "Affordable everyday poster print on bright white 170gsm silk paper — crisp lines and vibrant colour, printed with eco-conscious water-based inks. A great low-cost way to get a photo up on the wall.",
        variants: [
          { sku: "budget-poster-a5", label: "A5 - £13.99" },
          { sku: "budget-poster-a4", label: "A4 - £13.99" },
          { sku: "budget-poster-a3", label: "A3 - £15.99" },
          { sku: "budget-poster-a2", label: "A2 - £18.99" },
          { sku: "budget-poster-a1", label: "A1 - £23.99" },
          { sku: "budget-poster-4x6", label: "4x6 inch - £13.99" },
          { sku: "budget-poster-6x6", label: "6x6 inch - £13.99" },
        ],
      },
      {
        name: "Budget Framed Poster",
        img: "/products/budget-framed-poster.svg",
        desc: "Your favourite photo, ready to hang in minutes. This self-assembly framed poster arrives as one simple package — print and frame together, no separate ordering, no guesswork on sizing. Shatterproof glazing built in for safe, everyday hanging. An easy, affordable way to get a photo properly up on the wall.",
        variants: [
          { sku: "bfp-5x7", label: "5x7 inch - £24.99" },
          { sku: "bfp-6x8", label: "6x8 inch - £24.99" },
          { sku: "bfp-11x14", label: "11x14 inch - £32.99" },
          { sku: "bfp-12x12", label: "12x12 inch - £32.99" },
          { sku: "bfp-12x16", label: "12x16 inch - £31.99" },
          { sku: "bfp-16x16", label: "16x16 inch - £37.99" },
          { sku: "bfp-16x20", label: "16x20 inch - £44.99" },
          { sku: "bfp-18x24", label: "18x24 inch - £50.99" },
          { sku: "bfp-20x20", label: "20x20 inch - £48.99" },
          { sku: "bfp-20x28", label: "20x28 inch - £53.99" },
          { sku: "bfp-24x32", label: "24x31 inch - £68.99" },
        ],
      },
      {
        name: "Rigid Display Board",
        img: "/products/exoboard.webp",
        desc: "A tough, lightweight, fully waterproof display board — perfect for a photo that can live indoors or out, from a playroom wall to a garden fence. Rigid enough to stand freely or hang, with sharp, edge-to-edge colour that won't fade.",
        variants: [
          { sku: "exoboard-200x300", label: "8x12 inch (200x300mm) - £32.99" },
          { sku: "exoboard-210x297", label: "8x12 inch (210x297mm) - £32.99" },
          { sku: "exoboard-297x420", label: "12x17 inch - £40.99" },
          { sku: "exoboard-300x400", label: "12x16 inch - £44.99" },
          { sku: "exoboard-400x500", label: "16x20 inch - £64.99" },
          { sku: "exoboard-450x600", label: "18x24 inch - £77.99" },
          { sku: "exoboard-594x841", label: "23x33 inch - £96.99" },
          { sku: "exoboard-600x800", label: "24x31 inch - £104.99" },
          { sku: "exoboard-700x1000", label: "28x39 inch - £136.99" },
          { sku: "exoboard-841x1189", label: "33x47 inch - £168.99" },
        ],
      },
    ],
  },
  {
    key: "gifts",
    label: "Gift Tags & More",
    intro: "Got a dog? Before you order a pet tag, scan them in our free app <a class=\"app-link\" href=\"https://apps.apple.com/gb/app/whats-up-dog/id6771118261\" target=\"_blank\" rel=\"noopener\">What's Up Dog!</a> to instantly see their breed mix, personality traits and more — then turn that same photo into a tag, mug or poster right here.",
    introHtml: true,
    items: [
      {
        name: "Pet Tags",
        img: "/products/pet-tags.jpg",
        desc: "A genuinely useful safety item that also happens to be a lovely personal keepsake. Durable, scratch-resistant metal tag featuring your pet's own photo alongside their name and your contact details — perfect for collars, and a gift any pet owner will actually use and appreciate, not just admire.",
        variants: [
          { sku: "pet-tag-round", label: "Round Tag - £16.99" },
          { sku: "pet-tag-bone", label: "Bone Shape Tag - £16.99" },
        ],
      },
      {
        name: "Temporary Tattoos",
        img: "/products/temporary-tattoos.webp",
        desc: "A brilliant novelty gift or fun addition to any celebration. Each tattoo is printed from your own photo using safe, skin-friendly ink that applies in seconds with water and lasts several days — genuinely photo-realistic once applied. Popular for hen and stag parties, festivals, birthdays, or just for a laugh with friends and family. Available in five sizes to suit anything from a small wrist design to a full arm piece.",
        variants: [
          { sku: "tattoo-s", label: "Small (5cm x 7.5cm) - £11.99" },
          { sku: "tattoo-m", label: "Medium (7.5cm x 10cm) - £14.99" },
          { sku: "tattoo-l", label: "Large (10cm x 15cm) - £17.99" },
          { sku: "tattoo-xl", label: "Extra Large (20cm x 20cm) - £20.99" },
          { sku: "tattoo-xxl", label: "XXL (30cm x 30cm) - £28.99" },
        ],
      },
    ],
  },
];





let currentCatIndex = 0;

const catNav = document.getElementById("catNav");
const productsGrid = document.getElementById("products");
const sectionTitle = document.getElementById("sectionTitle");

function goToCategory(key, productName) {
  const i = CATEGORIES.findIndex(c => c.key === key);
  if (i === -1) return;
  currentCatIndex = i;
  renderCatNav();
  renderProducts();

  if (productName) {
    const targetId = "product-" + productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "box-shadow 0.3s ease";
        el.style.boxShadow = "0 0 0 3px rgba(212,168,67,0.6)";
        setTimeout(() => { el.style.boxShadow = ""; }, 2200);
        return;
      }
      const target = document.getElementById("sectionTitle");
      if (target) window.scrollTo({ top: target.offsetTop - 90, behavior: "smooth" });
    }, 50);
  } else {
    const target = document.getElementById("sectionTitle");
    if (target) window.scrollTo({ top: target.offsetTop - 90, behavior: "smooth" });
  }
}

function renderCatNav() {
  catNav.innerHTML = "";
  CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (i === currentCatIndex ? " active" : "");
    btn.textContent = cat.label;
    btn.addEventListener("click", () => {
      currentCatIndex = i;
      renderCatNav();
      renderProducts();
      window.scrollTo({ top: document.getElementById("sectionTitle").offsetTop - 90, behavior: "smooth" });
    });
    catNav.appendChild(btn);
  });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Tracks free cartoon generations for the whole visit (not per-item), so
// switching between products doesn't grant fresh free tries. Persisted in
// sessionStorage so it survives a page refresh within the same visit too.
const CARTOON_FREE_LIMIT = 1;
function getCartoonUsesThisSession() {
  return parseInt(sessionStorage.getItem("cartoonUses") || "0", 10);
}
function recordCartoonUse() {
  sessionStorage.setItem("cartoonUses", String(getCartoonUsesThisSession() + 1));
}

function showCartoonPreview(itemId, sku, photoBase64, mimeType, statusEl, btn) {
  if (getCartoonUsesThisSession() >= CARTOON_FREE_LIMIT) {
    statusEl.textContent = "You've already used your free cartoon preview for this visit.";
    statusEl.className = "status error";
    btn.disabled = false;
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "cartoon-preview-overlay";
  overlay.innerHTML = `
    <div class="cartoon-preview-card">
      <div class="cartoon-preview-title">Creating your cartoon...</div>
      <div class="cartoon-preview-loading" data-role="loading">This usually takes a few seconds ✨</div>
      <img class="cartoon-preview-img" data-role="image" style="display:none">
      <div class="cartoon-preview-buttons" data-role="buttons" style="display:none">
        <button class="cartoon-btn-primary" data-role="use">Use This ✓</button>
      </div>
      <div style="margin-top: 12px;">
        <button class="cartoon-btn-secondary" data-role="cancel" style="width:100%">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let currentCartoonBase64 = null;
  let currentCartoonMime = "image/png";

  async function generate() {
    recordCartoonUse();
    overlay.querySelector('[data-role="loading"]').style.display = "block";
    overlay.querySelector('[data-role="image"]').style.display = "none";
    overlay.querySelector('[data-role="buttons"]').style.display = "none";
    try {
      // Gemini expects raw base64 bytes only, not the full "data:image/...;base64,"
      // prefix that FileReader.readAsDataURL() produces - strip it before sending.
      const rawBase64 = photoBase64.includes(",") ? photoBase64.split(",")[1] : photoBase64;
      const res = await fetch(`${API_BASE}/api/cartoonify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: rawBase64, mimeType }),
      });
      const data = await res.json();
      if (data.base64Image) {
        currentCartoonBase64 = data.base64Image;
        currentCartoonMime = data.mimeType || "image/png";
        const imgEl = overlay.querySelector('[data-role="image"]');
        imgEl.src = `data:${currentCartoonMime};base64,${currentCartoonBase64}`;
        imgEl.style.display = "block";
        overlay.querySelector('[data-role="loading"]').style.display = "none";
        overlay.querySelector('[data-role="buttons"]').style.display = "flex";
      } else {
        overlay.querySelector('[data-role="loading"]').textContent =
          (data.error || "Couldn't generate the cartoon.") + (data.details ? " (" + data.details + ")" : "");
      }
    } catch (err) {
      overlay.querySelector('[data-role="loading"]').textContent =
        "Could not connect. Please try again.";
    }
  }

  overlay.querySelector('[data-role="cancel"]').addEventListener("click", () => {
    overlay.remove();
    btn.disabled = false;
    statusEl.textContent = "";
    statusEl.className = "status";
  });

  overlay.querySelector('[data-role="use"]').addEventListener("click", async () => {
    overlay.remove();
    await proceedToCheckout(itemId, sku, photoBase64, statusEl, btn, {
      addCartoon: true,
      cartoonBase64: currentCartoonBase64,
    });
  });

  generate();
}

async function proceedToCheckout(itemId, sku, photoBase64, statusEl, btn, cartoonOptions) {
  statusEl.textContent = "Preparing checkout...";
  statusEl.className = "status loading";
  try {
    const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        photoBase64,
        successUrl: window.location.origin + "/?order=success",
        cancelUrl: window.location.href,
        ...(cartoonOptions || {}),
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      statusEl.textContent = data.error || "Something went wrong";
      statusEl.className = "status error";
      btn.disabled = false;
    }
  } catch (err) {
    statusEl.textContent = "Could not connect. Please try again.";
    statusEl.className = "status error";
    btn.disabled = false;
  }
}

function attachBuyHandlers() {
  document.querySelectorAll(".buy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const itemId = btn.dataset.item;
      const item = window.__currentItems[itemId];
      const select = document.querySelector(`select[data-item="${itemId}"]`);
      const sku = select ? select.value : item.variants[0].sku;
      const fileInput = document.querySelector(`input[type="file"][data-item="${itemId}"]`);
      const cartoonToggle = document.querySelector(`.cartoon-toggle[data-item="${itemId}"]`);
      const statusEl = document.querySelector(`[data-status="${itemId}"]`);
      const file = fileInput.files[0];

      if (!file) {
        statusEl.textContent = "Please choose a photo first";
        statusEl.className = "status error";
        return;
      }

      btn.disabled = true;
      statusEl.textContent = "";
      statusEl.className = "status";

      try {
        const photoBase64 = await toBase64(file);

        if (cartoonToggle && cartoonToggle.checked) {
          showCartoonPreview(itemId, sku, photoBase64, file.type || "image/jpeg", statusEl, btn);
        } else {
          await proceedToCheckout(itemId, sku, photoBase64, statusEl, btn, null);
        }
      } catch (err) {
        statusEl.textContent = "Could not connect. Please try again.";
        statusEl.className = "status error";
        btn.disabled = false;
      }
    });
  });
}

function renderProducts() {
  const cat = CATEGORIES[currentCatIndex];
  sectionTitle.textContent = cat.label;
  productsGrid.innerHTML = "";
  window.__currentItems = {};

  const existingIntro = document.querySelector(".category-intro");
  if (existingIntro) existingIntro.remove();
  if (cat.intro) {
    const introEl = document.createElement("p");
    introEl.className = "category-intro";
    if (cat.introHtml) {
      introEl.innerHTML = cat.intro;
    } else {
      introEl.textContent = cat.intro;
    }
    productsGrid.parentElement.insertBefore(introEl, productsGrid);
  }

  cat.items.forEach((item, itemIndex) => {
    const itemId = `${currentCatIndex}-${itemIndex}`;
    window.__currentItems[itemId] = item;

    const card = document.createElement("div");
    card.className = "card";
    card.id = "product-" + item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const showDropdown = item.variants.length > 1;
    const variantOptions = item.variants
      .map(v => `<option value="${v.sku}">${v.label}</option>`)
      .join("");

    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}" loading="lazy">
      <div class="card-body">
        <h3>${item.name}</h3>
        ${showDropdown
          ? `<select class="variant-select" data-item="${itemId}">${variantOptions}</select>`
          : `<p class="price-range">${item.variants[0].label}</p>`
        }
        <p class="pp-note">Free UK delivery</p>
        <p class="desc">${item.desc}</p>
        <input type="file" accept="image/*" data-item="${itemId}">
        <div class="cartoon-toggle-row">
          <input type="checkbox" class="cartoon-toggle" data-item="${itemId}" id="cartoon-${itemId}">
          <label for="cartoon-${itemId}">✨ Turn this into a cartoon illustration! (+£4.00)</label>
        </div>
        <button class="buy-btn" data-item="${itemId}">Buy Now</button>
        <p class="status" data-status="${itemId}"></p>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  attachBuyHandlers();
}

renderCatNav();
renderProducts();

// Show a clear thank-you confirmation after a successful Stripe payment,
// since customers were previously landing back on a normal-looking
// homepage with no acknowledgment their order went through at all.
(function checkForOrderSuccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("order") !== "success") return;

  const overlay = document.createElement("div");
  overlay.className = "thankyou-overlay";
  overlay.innerHTML = `
    <div class="thankyou-card">
      <div class="thankyou-check">✓</div>
      <div class="thankyou-title">Thank you for your order!</div>
      <div class="thankyou-body">
        Your payment has gone through successfully. We're getting your order ready to print now,
        and it'll be on its way to you soon. If you have any questions in the meantime, feel free
        to get in touch.
      </div>
      <button class="thankyou-close">Continue Shopping</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector(".thankyou-close").addEventListener("click", () => {
    overlay.remove();
    // clean the ?order=success param out of the URL so a refresh doesn't re-show this
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);
  });
})();
</script>
</body>
</html>
