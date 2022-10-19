# Mailgun Failed Webhook

This worker sends an email every time it receives a webhook from Mailgun indicating an email has failed. This lets you go in and see why, and fix any issues, without emails being dropped silently.

## Set-up

1. Add the following environment variables to Cloudflare:

    ```
        DOMAIN=domain.com
        REPORTING_ADDRESS=me@domain.com
        MAILGUN_API_KEY=
        MAILGUN_SIGNING_KEY=
    ```

    You can get your Mailgun API key from your domain property inside Mailgun, and your Mailgun Signing Key from the Webhook page of a domain in your Mailgun dashboard.

2. Change the `account_id` in `wrangler.toml`
3. (Optional) Create a Cloudflare API Key that lets you manage workers. Add this key to GitHub Secrets as `CF_API_TOKEN`
4. Caching is not supported on the workers.dev domain so this needs to be deployed to a custom domain to prevent replay attacks

## Developing and Publishing with Wrangler

### Install dependencies

```
    npm i
```

### Start the development environment

```
    wrangler login
    wrangler dev
```

### Publish

```
    wrangler publish
```
