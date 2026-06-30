# GEO measurement data

`geo-query-set.csv` is the fixed 60-query baseline for discovery, comparison, purchase, application, FAQ, compliance, logistics, brand, and regional tests.

`geo-observation-log.csv` intentionally contains no synthetic observations. For each real test:

1. Run the exact query in the named engine and locale.
2. Record the UTC timestamp, query ID, model or mode, mention, citation URL and position.
3. Score factual accuracy from 1 to 5 after checking the cited landing page.
4. Preserve screenshots or exports outside this repository when the platform permits.
5. Repeat important queries with the declared variant ID; do not silently rewrite a query.

Observed visibility is not the same as page citability. Empty rows mean “not measured”, never “zero visibility”.
