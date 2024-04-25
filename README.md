# Vep Code Generator

To generate Graphql Schema and Resolver

## Usage

Appsync Cloudformation Deployment

## Steps to add new API endpoints

1. Add your GraphQL schema in Folder ./src/schema/{microservice-name}

2. Add your function Data in map.json in ./src/lambda/Mapper/map.json

  - The `queryItem` is the `Query` type that defines in the **top-level** entry points for querues that execute against AppSync
  - The `mutationItem` is the `Mutation` type that defines in the **top-level** entry points for querues that execute against AppSync
  - `functionArray` - plug in the pipeline resolvers function into the function array list to be exectued in sequence. 
      - If path and method are set, `lambdaMapper` function will be appended at the end of the array
      - To add authentication (JWT resolver) to each endpoint, please add `"AuthFunctionId"` to the functionArray
      - To add JWT extractor to each endpoint, please add `"JwtExtractorFunctionId"` to the functionArray
  - `service`: C2M/Content/Exhibitor/Fair/Buyer
  - `path`: HTTP Path of the data source to be invocated
  - `method`: HTTP Method of the data source to be invocated

3. type the following code to see if there is any error

```javascript
yarn install
yarn generate-main-json -- --env={ENV}
yarn build
```

## CI/CD steps instruction
  1. generate-artifact

     Generate main.json and target files (resolver.yaml, etc)

  2. foundation-upload-appsync-template-s3

     Upload target files

  3. upload-main-json
  
     Upload main.json for lambda's cicd 

  4. trigger-lambda-cicd

     Trigger cicd for following projects with same branch name, one job for one lambda
  - vep/microservice-foundation/vep-foundation-appsync-lambda-mapper
  - vep/microservice-foundation/vep-foundation-appsync-lambda-jwtgenerator
  - vep/microservice-foundation/vep-foundation-appsync-lambda-jwtextractor
  - vep/microservice-foundation/vep-foundation-appsync-lambda-auth

  5. foundation-cloudformation-appsync

     Create/ update cloudformation stack for appsync endpoint based on appsync.yaml

  6. vep-cloudformation-lambda

     Create/ update cloudformation stack for lambda based on lambda-{0,1}.*\.yaml, one yaml files for one lambda

  7. test-cloudformation

     Check cloudformation script for appsync deployed success or not

## Instruction to create new environment and new branch

1. For each repo below, create new branch with same name of appsync new branch. 
   Ensure CI/CD for each lambda is created for new branch.
  - vep/microservice-foundation/vep-foundation-appsync-lambda-mapper
  - vep/microservice-foundation/vep-foundation-appsync-lambda-jwtgenerator
  - vep/microservice-foundation/vep-foundation-appsync-lambda-jwtextractor
  - vep/microservice-foundation/vep-foundation-appsync-lambda-auth

2. Create following folders in S3
  - `s3://$AWS_BUCKET_NAME/$ENVIRONMENT/`
  - `s3://$AWS_BUCKET_NAME/$ENVIRONMENT/Resources/`
  - `s3://$AWS_BUCKET_NAME/$ENVIRONMENT/Artifact/Lambda-Mapper/`
  - `s3://$AWS_BUCKET_NAME/$ENVIRONMENT/Artifact/Lambda-JWTGenerator/`
  - `s3://$AWS_BUCKET_NAME/$ENVIRONMENT/Artifact/Lambda-JWTExtractor/`
  - `s3://$AWS_BUCKET_NAME/$ENVIRONMENT/Artifact/Lambda-Auth/`

3. Create Appsync CI/CD script with all CI/CD steps for new branchs, update the s3 path to path set in step 2. Push the changes to trigger CI/CD