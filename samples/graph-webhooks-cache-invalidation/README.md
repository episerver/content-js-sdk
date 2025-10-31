This is a [Next.js](https://nextjs.org) project that shows how to use Optimizely Graph Webhooks with Next.js cache invalidation.

## Setup

### 1. Deploy or use a tunnel

To try this project, you need an actual URL that can receive requests from Graph (`localhost` is not valid). Here are some options:

- Deploy this project to [Vercel](https://vercel.com)
- Use a local tunneling service like [ngrok](https://ngrok.com)

### 2. Set up the environment variables

Go to your CMS &rarr; Settings &rarr; API Key. Under "Render Content", copy the value "Single Key"

Create an `.env` file with the following content:

```ini
OPTIMIZELY_GRAPH_SINGLE_KEY=<the single key you copied>
```

Add one more line to the `.env` file with a randomly generated string. This string will be part of the webhook URL `https://example.com/webhooks/<WEBHOOK_ID>`, so ensure that the value is URL-friendly.

```ini
WEBHOOK_ID=randomly_generated_id
```

<details>
<summary>Why you need this?</summary>

Webhook URLs are public endpoints. Anyone with the URL will be able to revoke a cache. The `WEBHOOK_ID` environment variable ensures that the webhook URL is not publicly known. Treat the variable as a password or a token

</details>

### 3. Create the webhook

Run `npm run webhook:create` and follow the instructions to create a webhook in Graph that points to your project.

### 4. Create content

Go to your CMS and create a page

### 5. Create an application

Go to your CMS &rarr; Settings &rarr; Applications. Click "Create application" In the dialog:

- In _Application Name_ write "webhooks_test"
- Under _choose start page_ choose "from existing" and choose the page you created in the previous step.

Click create application and, in the list of applications, click the application you just created and go to "Hostnames". Click "Add Hostname". In the dialog:

- In _Hostname_ write the URL of your application, e.g. https://example.com.
- Check the "Use a secure connection (HTTPS)" checkbox
- In _Locale_ choose All

### 6. Build and start the project

Run `npm run build` and `npm start`

> [!Note]
> The command `npm run dev` does not work because Next.js cache is disabled in dev mode

### 7. Test the cache

Go to `<your project URL>/en`. You will see a page with the message:

```
This page is generated and cached: 2025-10-03T12:42:40.453Z. 15 seconds ago
```

Refresh the page. You will see that the date is the same and that the seconds counter has _not_ restarted.

### 8. Trigger a cache revalidation

Go to your CMS, make changes to the page `/en/` you created previously and publish them.

Go to `<your project URL>/en`. You will see that a different date and that the counter has restarted

### 9. Clean-up

Run `npm run webhook:edit` and follow the instructions to delete the webhook that you don't need anymore.
