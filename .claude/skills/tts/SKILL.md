---
name: tts
description: Generate podcast audio from script files using local Kokoro TTS
tools:
  - Read
  - Bash
---

# Text-to-Speech Podcast Generator

Convert a podcast script markdown file into MP3 audio using the locally installed Kokoro TTS CLI.

## Input

- `{{SCRIPT_PATH}}` -- absolute path to the podcast script markdown file
- `{{OUTPUT_PATH}}` -- absolute path for the output MP3 (should be in podcasts/audio/)

## Procedure

1. **Read the script** at `{{SCRIPT_PATH}}` and parse its contents.

2. **Identify speakers.** Lines prefixed with `HOST:` belong to the host speaker. Lines prefixed with `EXPERT:` belong to the expert speaker.

3. **Attempt two-voice generation.** Split the script into two temporary text files:
   - `host_lines.txt` -- contains only the HOST dialogue (strip the `HOST:` prefix)
   - `expert_lines.txt` -- contains only the EXPERT dialogue (strip the `EXPERT:` prefix)

4. **Generate audio for each voice separately.**
   If model files are available in the project root, pass `--model` and `--voices` flags. Otherwise let kokoro-tts use defaults:
   ```bash
   kokoro-tts host_lines.txt host.mp3 --format mp3 --voice af_heart --speed 1.0 --lang en-us
   kokoro-tts expert_lines.txt expert.mp3 --format mp3 --voice am_adam --speed 0.95 --lang en-us
   ```

5. **Fallback: single-voice generation.** If splitting by speaker is not practical (e.g., the script has no speaker prefixes, or interleaving the two audio tracks is not feasible), generate the full script as one file:
   ```bash
   kokoro-tts script.txt output.mp3 --format mp3 --voice af_heart --speed 1.0 --lang en-us
   ```

6. **Place the final MP3** at `{{OUTPUT_PATH}}`. Ensure the parent directory exists before writing.

7. **Clean up** any temporary text files created during the process.

## Voice Reference

| Speaker | Voice ID   | Speed | Language |
|---------|------------|-------|----------|
| HOST    | af_heart   | 1.0   | en-us    | Best overall female voice |
| EXPERT  | am_adam    | 0.95  | en-us    | Male voice for contrast   |

## Notes

- If `kokoro-tts` is not found on PATH, report the error clearly and do not attempt alternative TTS tools.
- Large scripts may take several minutes to process. Let the command run to completion.
- The output format is always MP3.
