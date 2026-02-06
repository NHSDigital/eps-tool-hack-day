export CDK_CONFIG_versionNumber=undefined
export CDK_CONFIG_commitId=undefined
export CDK_CONFIG_isPullRequest=true
export CDK_CONFIG_environment=dev

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

.PHONY: install build test publish release clean

install: install-node install-hooks


install-node:
	npm ci

compile-node:
	npx tsc --build tsconfig.build.json

compile: compile-node


lint-githubactions:
	actionlint

lint-githubaction-scripts:
	shellcheck .github/scripts/*.sh

lint: lint-node lint-githubactions lint-githubaction-scripts react-lint

test: compile
	npm run test --workspace packages/cdk
	npm run test --workspace packages/hack

clean:
	find . -name 'coverage' -type d -prune -exec rm -rf '{}' +
	find . -name 'lib' -type d -prune -exec rm -rf '{}' +
	rm -rf cdk.out
	rm -rf .local_config
	rm -rf cfn_guard_output

deep-clean: clean
	rm -rf .venv
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

aws-configure:
	aws configure sso --region eu-west-2

aws-login:
	aws sso login --sso-session sso-session

react-dev:
	npm run dev --workspace packages/hack

react-build:
	export BASE_PATH=/site && npm run build --workspace packages/hack

react-start:
	 npm run start --workspace packages/hack

cdk-watch:
	./scripts/run_sync.sh


cdk-synth: 
	CDK_APP_NAME=HackApp \
	CDK_CONFIG_stackName=HackStack \
	CDK_CONFIG_epsDomainName="foo.bar" \
	CDK_CONFIG_epsHostedZoneId=123abc \
	CDK_CONFIG_splunkDeliveryStream="splunk-stream" \
	CDK_CONFIG_splunkSubscriptionFilterRole="splunk-role" \
	CDK_CONFIG_cloudfrontDistributionArn="arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5" \
	CDK_CONFIG_logRetentionInDays=14 \
	CDK_CONFIG_isPullRequest=true \
	CDK_CONFIG_cloudfrontCertArn="arn:aws:acm:us-east-1:123456789012:certificate/1234abcd-56ef-78gh-90ij-1234567890ab" \
	CDK_CONFIG_shortCloudfrontDomain="d111111abcdef8" \
	CDK_CONFIG_fullCloudfrontDomain="d111111abcdef8.cloudfront.net" \
	CDK_CONFIG_cloudfrontDistributionId="EDFDVBD632BHDS5" \
	npm run cdk-synth --workspace packages/cdk

create-npmrc:
	gh auth login --scopes "read:packages"; \
	echo "//npm.pkg.github.com/:_authToken=$$(gh auth token)" > .npmrc
	echo "@nhsdigital:registry=https://npm.pkg.github.com" >> .npmrc