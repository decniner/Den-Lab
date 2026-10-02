# GitLab morning upload plan

User scope: upload the exact 80-second Japan edition privately now and automate
morning private uploads with GitLab. Public publishing remains a separate approved
command. Default proposed time is 07:00 Asia/Tokyo, awaiting user preference.

1. Add failing tests for importing a rendered portrait edition, tamper/freshness
   guards, persistent duplicate-upload state and morning retry behavior.
2. Add `upload-rendered` and an importer that reads the source/validation bundle,
   confirms the actual MP4 with FFprobe/decode, hashes all editorial artifacts and
   hands off to the existing crash-recoverable YouTube uploader. Repeated commands
   use the existing edition state rather than replacing it.
3. Add a morning runner that selects today's prepared and fact-checked edition
   from a durable inbox; absent/stale/failed/duplicate content stops safely. It
   never treats the October 2 video as tomorrow's new news. This automates the upload
   of prepared editions; it does not claim autonomous reporting or generation.
4. Add a manual and opt-in scheduled `.gitlab-ci.yml` using a dedicated Windows
   shell runner and durable state outside GitLab's disposable checkout. Use file
   variables for OAuth, resource serialization and edition locks, zero public jobs.
5. Test all paths offline, prepare the existing edition's daily inbox metadata,
   document OAuth, runner registration, secrets and schedule activation. Upload and
   activate the real schedule as soon as channel/project credentials are provided.

Current external blockers: no config.json, token.json or client_secrets.json;
no GitLab remote/project connection or CLI authentication. Do not report either
an upload or a running schedule until the respective service confirms it.
