# Stock providers and rights review

## API-free manual route (default)

Search in a normal browser and download using each provider's own asset-page controls, following the current site terms. No API key is required for this route. Do not scrape search pages, automate browser actions around bot checks, bypass rate limits, or copy an undocumented CDN URL. Open each exact asset page and check its applicable license before downloading.

- Pexels video search: <https://www.pexels.com/videos/>. Check the [Pexels license](https://www.pexels.com/license/) and [terms](https://www.pexels.com/terms-of-service/).
- Pixabay video search: <https://pixabay.com/videos/>. Check the [Pixabay Content License summary](https://pixabay.com/service/license-summary/).
- Mixkit: <https://mixkit.co/free-stock-video/>. Check the license attached to the specific clip and distinguish Free License from Restricted License; do not treat all search results as having identical permissions.

For every manually acquired clip, retain its asset page URL, creator, provider, license page and date checked, local filename, download date, attribution requirements, restrictions, and the results of a human review for releases and third-party rights. Set `acquisition_method` to `manual-provider-download`, `download_url` to an empty string, and `downloaded_via_provider_ui` to `true` in the final manifest. This records that the provider's own UI was used; it does not itself establish that rights are cleared. The validator still requires the documented rights review.

## Optional API route

Use an official provider API only when the user has an authorized API key. Current documentation links:

- Pexels video API: <https://www.pexels.com/api/documentation/>. The current video search endpoint is `GET https://api.pexels.com/v1/videos/search`; authenticate with the `Authorization` header. See the [Pexels license](https://www.pexels.com/license/) and [terms](https://www.pexels.com/terms-of-service/).
- Pixabay video API: <https://pixabay.com/api/docs/>. The video search endpoint is `GET https://pixabay.com/api/videos/`; its API key is a query parameter. See the [Pixabay Content License summary](https://pixabay.com/service/license-summary/).
- Mixkit does not have an API integration in this skill; use its normal provider UI and verify the asset-specific license.

The included discovery helper records candidates; it does not download or automatically approve them. Review the linked source page and license before use. Record the checked license URL, check date/version, intended commercial/social use, required attribution, and any restrictions. Confirm whether releases or additional permissions are needed for recognizable people, private property, trademarks, copyrighted artwork, or sensitive contexts. Mark third-party rights `clear` only when the evidence supports that conclusion. Do not treat a stock site's generic license as proof of model/property releases.

For published work, include provider attribution when required and retain creator credit when available. Keep an internal asset-to-scene manifest even when attribution is optional. If a license changes or an asset is removed, preserve the dated review record and do not reuse it in a new project without rechecking.

Never download from YouTube, social platforms, or an arbitrary CDN discovered by search. A direct file URL is only for the optional documented API path. For manual acquisition, use the provider's own download control and do not construct or copy undocumented CDN links.

## Discovery command

Set authorized keys in the local process environment without placing them in source files, project JSON, or command history. Then run from the skill directory:

```powershell
python .\scripts\discover_footage.py --brief .\examples\japan-brief.json --output .\project\candidates.json
```

The helper queries each configured provider independently, retries a failed GET once, records provider errors without printing URL details, and keeps every result at `pending` review status. No configured key produces a clear no-candidate result; it does not fall back to page scraping. API discovery is optional. For manual discovery, use the browser route above, then record the verified asset and review fields directly in the project manifest and have `scripts/validate_manifest.py` check it before rendering.
