This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Step 1. Login to your instance

Run the command:

```bash
pnpm exec optimizely-cms-cli login
```

### Step 2. Sync content types

Run the command:

```bash
pnpm exec optimizely-cms-cli config push
```

### Step 3. Setup environmental variables

Copy `.env.example` into `.env`. Open the file and add the required environmental variables

### Step 4. Create content

1. Go to your CMS and create a page with type "Landing Page".
2. Do not forget to fill the "Name in URL" field
3. Publish the content.

### Step 5. Test the content in your app

Start the app

```bash
pnpm dev
```

- Open `http://localhost:3000/<lang>/<slug>`, where `<lang>` is the language code (for example `en`) and `<slug>` is the _name in URL_ of the previous step.

  You should see the content of the page rendered with the components in the project

- Append `http://localhost:3000/json/<lang>/<slug>` to the URL.

  You should see the content of the page in JSON.
