# Current evidence gaps and next improvements

Updated 22 October 2026 from the local implementation and source review. No traveler sessions have been run.

| Evidence gap | Current treatment | Evidence needed next |
|---|---|---|
| Door-to-door ranges are planning estimates, not timed field measurements. Published travel times vary by date and transfer. | Pages show a range, identify the Tokyo Station reference origin, and link operators for live service checks. | Record a dated operator itinerary for representative weekdays and weekends; measure actual walk segments in the field before describing them as tested. |
| The Narita transport estimate depends on the chosen rail operator, departure station, and ticket. | The guide names the uncertainty and links to official access information. | Recalculate totals against a dated JR and Keisei fare lookup; retain the selected origin and fare assumptions beside the number. |
| Mitake combines a bus, cable car, shrine stairs, and an optional rough trail. Access conditions vary. | Shrine-only and Rock Garden plans are separated; the guide flags stairs and unpaved terrain and links current operators. | Verify bus/cable-car connection windows, trail closure notices, accessible alternatives, and return buffers on the same date. |
| Stop coordinates and generated walking links are useful navigation starts, but the abstract plots are not surveyed paths or entrance guarantees. | Maps are labelled approximate; every stop has a separate map lookup and walking-directions link. | Field-check entrances and walking segments, including steps, crossings, surfaces, and mobility alternatives. |
| Commons photographs show destination context but do not document every listed stop or current site condition. | Each guide credits a distinct, licensed destination photograph and links its original file page. | Commission or capture a licensed arrival/entrance/terrain sequence for each route, with captions and precise locations. |
| Usability is not established by code checks. | A traveler session script and blank findings form are provided. | Run sessions with actual travelers across phone and desktop, then prioritize observed task failures and retest. |

## Next three improvements, based on this review

1. Verify and date the Tokyo-origin fare and timetable assumptions, especially Narita's operator-dependent fare and Mitake's bus-to-cable-car connection.
2. Conduct one documented field audit per route for entrance coordinates, actual walking conditions, accessibility barriers, meal timing, and weather fallback viability.
3. Run the usability sessions in `docs/usability/` on mobile and desktop. Revise the three most frequently misunderstood decisions based on observations rather than adding decorative features.
