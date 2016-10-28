# API Documentation

## POST

### /api/rate/:rating

Submit a rating of @justgrimes. `rating` must be a whole number between 1 and 5.

Status Code | Description
----------- | -----------
200         | Success
400         | Bad request

## GET

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

### /api/ratings/today

Today's ratings in JSON format.

Status Code | Description
----------- | -----------
200         | Success
205         | No ratings submitted yet

### /api/ratings/:date

Ratings for an historical date in JSON format. 'date' must be in the format YYYY-MM-DD.

Status Code | Description
----------- | -----------
200         | Success
205         | No ratings submitted on this day
400         | Bad request
