# API examples

## Trigger discovery

```http
POST /api/discovery/run
```

## List candidates

```http
GET /api/candidates?status=needs_review
```

## Update candidate

```http
PATCH /api/candidates/:id
Content-Type: application/json

{
  "question": "Will NASA launch the Artemis II mission before July 1, 2027?",
  "resolutionCriteria": "Resolve YES if NASA officially confirms that Artemis II has launched before the deadline; otherwise NO.",
  "resolutionSource": "https://www.nasa.gov/"
}
```

## Approve

```http
POST /api/candidates/:id/review
Content-Type: application/json

{"action":"approve","note":"Reviewed and approved."}
```

## Reject

```http
POST /api/candidates/:id/review
Content-Type: application/json

{"action":"reject","note":"Resolution source is not sufficiently reliable."}
```

## Create market

```http
POST /api/markets/from-candidate/:id
```

Returns a mock market object only when the candidate is `approved`.
