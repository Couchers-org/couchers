# Need: AWS_PROFILE (or some other auth for aws cli), AWS_ACCOUNT_NUMBER, AWS_S3_BUCKET_NAME, AWS_CF_DISTRIBUTION_ID
version=$(git rev-parse --short head)

echo "Generating protos..."
docker run --rm -w /app -v $(pwd):/app couchers/grpc ./generate_protos.sh

pushd proxy
echo "Building proxy..."
docker build -t couchers/proxy .
echo "Tagging proxy..."
docker tag couchers/proxy:latest $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/proxy:latest
docker tag couchers/proxy:latest $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/proxy:$version
echo "Pushing proxy..."
docker push $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/proxy:latest
popd

pushd backend
echo "Building backend..."
docker build --build-arg version=$version -t couchers/backend .
echo "Tagging backend..."
docker tag couchers/backend:latest $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/backend:latest
docker tag couchers/backend:latest $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/backend:$version
echo "Pushing backend..."
docker push $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/backend:latest
popd

pushd media
echo "Building media..."
docker build -t couchers/media .
echo "Tagging media..."
docker tag couchers/media:latest $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/media:latest
docker tag couchers/media:latest $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/media:$version
echo "Pushing media..."
docker push $AWS_ACCOUNT_NUMBER.dkr.ecr.us-east-1.amazonaws.com/couchers/media:latest
popd

pushd frontend
echo "Building frontend..."
yarn
VUE_APP_VERSION=$version yarn build
echo "Deploying frontend..."
aws s3 sync dist/ s3://$AWS_S3_BUCKET_NAME --acl public-read
aws cloudfront create-invalidation --distribution-id $AWS_CF_DISTRIBUTION_ID --paths "/*"
popd
