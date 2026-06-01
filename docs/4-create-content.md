# Create content

In this page, you will learn to create content in the CMS. Once you created it, you will fetch it using the SDK in the next steps

## Step 1. Create a "home" content with type Article

1. Go to your CMS and click "Create Content"

   ![Dashboard screenshot](./images/dashboard.png)

2. Put "Home" as name and select content type Article

   ![Create page dialog screenshot](./images/create-page-dialog.png)

3. Fill some content
4. Click "Publish" &rarr; "Publish Content"

   ![Publish dialog screenshot](./images/publish.png)

## Step 2. Create an application

### Option A: Manual (UI-based)

1. Go to **Settings** → **Applications** → **Create Application**
2. Enter an **Application Name** (e.g., `my-app`) - API ID is auto-generated
3. Select a start page: **From Existing** → **Home**
4. Click **Create Application**

   ![Create application dialog](./images/create-application.png)

### Option B: Programmatic (Config-based)

Create content and applications automatically using `optimizely.config.mjs`:

1. **Define content array** - specify content to create from existing contentTypes:

   ```javascript
   export default buildConfig({
     components: ['./src/components/**/*.tsx'],
     content: [
       {
         key: 'HomeContent',           // unique key for reference
         displayName: 'Home',           // display name in CMS
         contentType: 'Article',        // existing contentType key
       },
     ],
     applications: [
       {
         key: 'my_app',
         displayName: 'My App',
         type: 'website',
         isDefault: true,
         entryPoint: 'HomeContent',     // reference content key
         hosts: [
           {
             authority: 'localhost:3000',
             type: 'primary',
             preferredUrlScheme: 'https',
           },
         ],
         // Optional - defaults shown below
         previewUrlFormats: {
           any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
         },
       },
     ],
   });
   ```

2. **Run config push**:

   ```bash
   optimizely-cms-cli config push
   ```

    This creates content instances from the `content` array and applications automatically.

**How it works:**

The application creation operates on the following order with explicit dependencies:

1. **Content instances** (defined in the `content` array) instantiate Page (`_page`) or Experience (`_experience`) content by referencing existing contentType definitions. Each instance specifies a `contentType` key and provides display metadata for CMS presentation.

2. **Applications** (defined in the `applications` array) establish the deployment context for content. Each application designates an `entryPoint` that references a content instance key, defining the application's start page. Applications also configure routing hosts, preview URL patterns, and application-level settings.

The CLI enforces this dependency chain during `config push`: contentTypes must exist before content instances can reference them, and content instances must exist before applications can designate them as entry points.

## Step 3. Change the "home" URL

1. Go to your CMS &rarr; Content &rarr; Home
2. Scroll down and under "Name in URL" click "Change"
3. Leave the field blank.
4. Click "Publish" &rarr; "Publish Content"

## Next steps

Now you are ready to [fetch the content](./5-fetching.md) you just created.
