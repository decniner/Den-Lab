# Netflix Japan Telegram notifier

Checks Netflix's official Japanese “new to watch” page daily and sends a Telegram message when a dated movie or series becomes available. It uses the release dates published on the page; it does not sign in to or scrape a Netflix member account.

## One-time setup

1. In Telegram, talk to [@BotFather](https://t.me/BotFather), run `/newbot`, and copy the bot token. Keep the token private.
2. Open the new bot and send it `/start`.
3. Get your Telegram numeric chat ID from [@userinfobot](https://t.me/userinfobot).
4. In this GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `TELEGRAM_BOT_TOKEN`: the token from BotFather
   - `TELEGRAM_CHAT_ID`: your numeric Telegram chat ID
5. In **Actions**, open **Netflix Japan Telegram notifications → Run workflow**. Select **Send a Telegram test message** to verify the bot.

Optionally, enable the YouTube Data API in a Google Cloud project, create an API key, and add it as the `YOUTUBE_API_KEY` secret. When set, the notifier links a title-matched trailer from a Netflix YouTube channel when it can verify one. Without the key, it includes a YouTube search link instead. Keep the key private.

The scheduled check runs daily at 06:00 Japan time. You can also start a regular check manually from the Actions page.

## Scope and limitations

- The source is Netflix's public Japan release page, not an official catalog API. It covers titles listed there and may not include every licensed catalog addition.
- The first normal run only notifies titles dated today, then records earlier titles as already seen to avoid a backlog.
- Release notices depend on Netflix maintaining the public page and its dated entries.
- Never commit bot tokens to the repository or paste them into chat.
- YouTube links are either a matching video from a Netflix channel or a search page; the notifier does not claim unverified videos are official trailers.
