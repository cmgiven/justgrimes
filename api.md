# API Documentation

## POST

### /api/rate/:rating

Submit a rating of @justgrimes. `rating` must be a whole number between 1 and 5 (both numerals and spelled-out English numbers are accepted).

Status Code | Description
----------- | -----------
200         | Success
400         | Bad request

## GET

Ratings are returned by day with three values: `date` (YYYY-MM-DD), `points`, and `ratingCount`. The average rating can be determined by dividing `points` by `ratingCount`, the total number of ratings received.

### /api/ratings

All historical ratings in JSON format.

Status Code | Description
----------- | -----------
200         | Success

### /api/ratings/csv

All historical ratings in CSV format.

Status Code | Description
----------- | -----------
200         | Success

### /api/ratings/xml

All historical ratings in XML format.

Status Code | Description
----------- | -----------
200         | Success

### /api/ratings/today

Today's ratings in JSON format.

Status Code | Description
----------- | -----------
200         | Success
205         | No ratings submitted yet

### /api/ratings/:date

Ratings for an historical date in JSON format. `date` must be in the format YYYY-MM-DD.

Status Code | Description
----------- | -----------
200         | Success
205         | No ratings submitted on this day
400         | Bad request
