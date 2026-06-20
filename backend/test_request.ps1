$json = '{
  "name": "abc",
  "email": "abcwithout anymail.com",
  "gender": "Male",
  "age": 25,
  "phoneNumber": "1234",
  "bio": "",
  "profileCompleteness": 20,
  "hasProfilePhoto": false
}'

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/detection/test-analyze" -Method POST -ContentType "application/json" -Body $json -TimeoutSec 10 -UseBasicParsing

$response.Content
