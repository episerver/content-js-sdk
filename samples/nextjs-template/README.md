# NextJS Sample site

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features Demonstrated

This template showcases the following Optimizely CMS SDK capabilities:

- **Content Types**: Defining and working with custom content types
- **Display Settings**: Creating and rendering components with display settings
- **Page and Experience Rendering**: Rendering CMS pages and experiences (blank experiences and sections)
- **Preview Mode**: Setting up and configuring live preview/edit mode

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

- Open `https://localhost:3000/<lang>/<slug>`, where `<lang>` is the language code (for example `en`) and `<slug>` is the _name in URL_ of the previous step.

  You should see the content of the page rendered with the components in the project

- Go to `https://localhost:3000/json/<lang>/<slug>`

  You should see the content of the page in JSON.

### Step 6. Setup an application in the CMS

1. Go to your CMS and then "Settings" > "Applications".
2. Click "Create Application"
3. Set the following values:

   - Application Name: "test"
   - Select the content you have created as a start page.

   Click "Next"

4. Click "test" (the application you have created) to open its settings and then "Hostnames"
5. Click "Add Hostname..."
6. Set the following values:

   - Hostname: `localhost:3000`
   - Check "Use a secure connection (HTTPS)"
   - Locale: `all`

   Click Add

### Step 7. Test preview/edit mode

In the CMS, go to the content you created in step 4 and edit. You should see the preview in the right hand side
