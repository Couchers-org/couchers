# New ranking/recommendation infrastructure

## How the old system works

1. Every user have a `recommendation_score`, which is a simple heuristic for "good profiles", along the lines of whether the user has completed their profile, has been active, has various verification badges, etc
2. The `recommendation_score` itself is deterministic. At search time we add some random noise to reshuffle results a bit, seeded per viewer and stable for a week (see `_user_search_noise` in `search.py`), so different members see a different order
3. The `recommendation_score` is updated every 24 hours via a background job (see `update_recommendation_scores` in `handlers.py`)
4. When another memer searches for users in an area, they are listed and paginated by `recommendation_score`
5. For experimenting with alternative rankings, the `search_ranking_offsets_variant` flag can put a viewer on a variant, in which case per-user offsets from the `user_ranking_offsets` table for that variant are added to the score

In summary, there is a fixed score that is updated every day that determines your ranking. Apart from the per-viewer noise, this ranking is the same for everyone searching for users.

We need to extend this to be more versatile (e.g. showing a mix of old and new users) and more personalized (so we can show a different results list for different users).

## Proposal for a new system

1. Every user still has a `recommendation_score`, but this time it is used only in early-stage ranking to make sure we don't have to rerank 2000 results, etc

### Considerations

#### Performance

#### Stability

If you zoom/pan around, the ranking shouldn't jump around
