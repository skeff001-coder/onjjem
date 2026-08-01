"""
Patches ios/Podfile (regenerated fresh by `expo prebuild --clean` every
build) to:

1. Compile the bundled `fmt` C++ library against the C++17 standard
   instead of C++20, and disable FMT_USE_CONSTEVAL.

   Why: Xcode 26.4's Clang tightened consteval validation, and the fmt
   version vendored by React Native 0.81.x fails to compile under those
   stricter rules (facebook/react-native#55601, expo/expo#44229).

2. Disable Xcode 15+'s "User Script Sandboxing" for every pod target.

   Why: Xcode's User Script Sandboxing blocks CocoaPods "[CP-User]"
   run-script build phases from writing files unless they explicitly
   declare their outputs. Several Expo-generated script phases (e.g.
   "Generate updates resources for expo-updates") don't declare
   outputs, so Xcode is allowed to invoke them more than once, and the
   sandboxed re-invocation fails outright with
   "PhaseScriptExecution ... exited with status code 65" — with no
   readable error printed, since the script is killed by the sandbox
   before it can write anything. This is a widely-reported Expo/Xcode
   15+ issue. Disabling ENABLE_USER_SCRIPT_SANDBOXING for all targets
   fixes it.

Root cause of an earlier version of the fmt patch not working: Expo's
generated Podfile calls react_native_post_install(installer, ...)
inside the post_install block, and that helper (via
NewArchitectureHelper.set_clang_cxx_language_standard_if_needed, in
react-native's own scripts/cocoapods/new_architecture.rb) unconditionally
force-sets CLANG_CXX_LANGUAGE_STANDARD = "c++20" on EVERY pod target,
including fmt. If our patch runs before that call, it gets silently
overwritten. So this version inserts at the very END of the
post_install block (found via do/end depth tracking, not a fixed
line match) to guarantee it runs last and actually sticks. The same
placement is used for the sandboxing fix for the same reason.

Remove the fmt patch once React Native ships a fmt version fixed
upstream. The sandboxing patch should stay indefinitely — it's not
tied to a specific RN/Xcode version bug, just how Apple's sandboxing
feature interacts with un-declared-output script phases in general.
"""

import re

PODFILE = "ios/Podfile"

FMT_PATCH_LINES = """    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
          existing_defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
          existing_defs = [existing_defs] if existing_defs.is_a?(String)
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = existing_defs + ['FMT_USE_CONSTEVAL=0']
        end
      end
    end
"""

SANDBOX_PATCH_LINES = """    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
      end
    end
"""

BLOCK_OPENERS = re.compile(r"(\bdo\b(\s*\|[^|]*\|)?\s*$)|(^\s*(if|unless|case|def|class|module|begin)\b)")
BLOCK_CLOSER = re.compile(r"^\s*end\s*$")


def find_block_end(lines, start_index):
    """Given the index of a line that opens a block (e.g. 'post_install do
    |installer|'), return the index of the line containing its matching
    'end', tracking nested do/end pairs so we don't stop at the first
    nested block's end."""
    depth = 1
    for i in range(start_index + 1, len(lines)):
        line = lines[i]
        if BLOCK_CLOSER.match(line):
            depth -= 1
            if depth == 0:
                return i
        elif BLOCK_OPENERS.search(line):
            depth += 1
    return None


def insert_patch_at_block_end(lines, patch_lines, marker):
    """Finds the post_install block and inserts patch_lines immediately
    before its closing 'end', returning the updated lines list. Returns
    None (and prints a diagnostic dump) if the block can't be found."""
    start_index = None
    for i, line in enumerate(lines):
        if re.search(r"post_install\s+do\s*\|installer\|", line):
            start_index = i
            break

    if start_index is None:
        print(f"WARNING ({marker}): could not find 'post_install do |installer|' line — dumping Podfile for diagnosis:")
        print("=" * 60)
        print("\n".join(lines))
        print("=" * 60)
        return None

    end_index = find_block_end(lines, start_index)
    if end_index is None:
        print(f"WARNING ({marker}): found post_install block opener but couldn't find its matching 'end' — dumping Podfile for diagnosis:")
        print("=" * 60)
        print("\n".join(lines))
        print("=" * 60)
        return None

    lines[end_index:end_index] = patch_lines.rstrip("\n").split("\n")
    return lines


with open(PODFILE) as f:
    content = f.read()

if "target.name == 'fmt'" in content:
    print("fmt patch already present — skipping")
else:
    lines = content.split("\n")
    updated = insert_patch_at_block_end(lines, FMT_PATCH_LINES, "fmt patch")
    if updated is not None:
        lines = updated
        content = "\n".join(lines)
        with open(PODFILE, "w") as f:
            f.write(content)
        print("Patched Podfile: fmt pod pinned to C++17 + FMT_USE_CONSTEVAL=0, inserted at end of post_install block (runs after react_native_post_install)")

with open(PODFILE) as f:
    content = f.read()

if "ENABLE_USER_SCRIPT_SANDBOXING" in content:
    print("User Script Sandboxing patch already present — skipping")
else:
    lines = content.split("\n")
    updated = insert_patch_at_block_end(lines, SANDBOX_PATCH_LINES, "sandboxing patch")
    if updated is not None:
        lines = updated
        content = "\n".join(lines)
        with open(PODFILE, "w") as f:
            f.write(content)
        print("Patched Podfile: ENABLE_USER_SCRIPT_SANDBOXING = NO set for all targets, inserted at end of post_install block")
