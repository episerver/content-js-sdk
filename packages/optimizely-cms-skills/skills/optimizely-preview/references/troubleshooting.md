# Troubleshooting Preview Issues

This reference provides systematic troubleshooting steps for common live preview issues in Optimizely CMS.

## When to Use This Guide

Use this guide when:
- "Preview isn't working"
- "I don't see preview in the CMS"
- "Preview shows blank screen"
- "Preview button doesn't appear"
- "Preview doesn't update"

## Common Issues and Solutions

### Issue 1: Preview Shows Blank Screen or Error

**Symptoms:**
- Clicking preview in CMS opens a blank page
- Error page or crash when preview loads
- Nothing renders in preview mode

**Check:**

1. **Open browser console** when clicking preview - are there errors?
2. **Check if preview route exists** and is accessible
3. **Verify environment variables** are set correctly
4. **Check if dev server is running**

**Common causes:**

- `OPTIMIZELY_CMS_URL` missing or incorrect in `.env`
- Missing `withAppContext` wrapper on preview route
- Missing `<PreviewComponent />` or `<Script>` tag
- Component not registered for the content type being previewed
- Dev server not running or crashed

**Solutions:**

```env
# Verify .env has this variable
OPTIMIZELY_CMS_URL=https://your-cms-url.optimizely.com
```

```tsx
// Verify preview route has all required components
import { withAppContext } from '@optimizely/cms-sdk/react';
import { Script } from 'next/script';
import { PreviewComponent } from '@optimizely/cms-sdk/react/components';

export default withAppContext(async function PreviewPage() {
  return (
    <>
      <Script src={getCommunicationInjectorUrl()} />
      <PreviewComponent />
      {/* content rendering */}
    </>
  );
});
```

### Issue 2: Preview Button Doesn't Appear in CMS

**Symptoms:**
- No "Preview" button in CMS editor
- Preview option is grayed out or missing
- Can't find where to enable preview

**Check:**

1. **Is the hostname configured in CMS?**
2. **Is the preview URL format enabled and configured?**
3. **Are preview tokens enabled?**

**How to verify in CMS:**

1. Go to **Settings → Live Preview** (or Preview Settings)
2. Ensure **"Use Preview Tokens"** is selected
3. Ensure **"Preview URL format"** is enabled
4. Ensure the URL matches your preview route format

**Expected configuration:**

```
Preview URL format: https://localhost:3000/preview?key={contentKey}&version={version}
```

**Common causes:**

- Hostname not added to CMS allowed hosts
- Preview URL format not configured
- Preview tokens disabled
- Wrong URL format (missing parameters)

**Solutions:**

1. **Add hostname** to CMS configuration
2. **Enable preview URL format** with correct parameters:
   - `{contentKey}` - The content item identifier
   - `{version}` - The content version
3. **Enable preview tokens** for secure preview access
4. **Save changes** and refresh CMS editor

### Issue 3: Preview Opens But Doesn't Update

**Symptoms:**
- Preview window opens successfully
- Initial content loads
- Changes in CMS don't reflect in preview
- Preview stays static

**Check:**

1. **Is `communicationinjector.js` loading?** (Check network tab)
2. **Is `<PreviewComponent />` included** in the preview route?
3. **Are there CORS errors** in console?

**Common causes:**

- `OPTIMIZELY_CMS_URL` doesn't match the actual CMS URL
- CORS blocked the injector script
- Missing `<PreviewComponent />`
- Network/firewall blocking CMS communication

**Solutions:**

```tsx
// Verify Script tag is present
<Script src={getCommunicationInjectorUrl()} />

// Verify PreviewComponent is included
<PreviewComponent />
```

**Check network tab:**
- Look for `communicationinjector.js` request
- Should return 200 status
- Should load from CMS URL

**CORS errors:**
- Ensure `OPTIMIZELY_CMS_URL` exactly matches CMS domain
- Check for trailing slashes (should NOT have trailing slash)
- Verify CMS allows your localhost/dev domain

### Issue 4: Preview Shows 404 or Wrong Content

**Symptoms:**
- Preview opens but shows "Not Found" or 404
- Shows wrong page content
- Shows default/fallback content instead of edited content

**Check:**

1. **Is the content type registered** with a component?
2. **Is `getPreviewContent()` being called** with correct parameters?
3. **Check the URL parameters** being sent from CMS

**Common causes:**

- Content type not registered in `initReactComponentRegistry`
- Component not exported correctly
- Wrong content key or version in URL
- `getPreviewContent()` not called or missing parameters

**Solutions:**

```tsx
// Verify content type is registered
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react';
import { MyContentType } from '@/components/MyContentType';

initReactComponentRegistry([
  MyContentType,  // Must be registered
]);
```

```tsx
// Verify getPreviewContent() is called correctly
const { key, version } = searchParams;
const content = await getPreviewContent({ key, version });
```

### Issue 5: Environment Variables Not Working

**Symptoms:**
- Preview route crashes with "undefined" errors
- Cannot connect to CMS
- Environment variables appear to be missing

**Check:**

1. **Is `.env` in the correct location** (project root)?
2. **Did you restart the dev server** after adding/changing `.env`?
3. **Are variable names exactly correct** (case-sensitive)?

**For Next.js specifically:**

- **Server-side only** (NO `NEXT_PUBLIC_` prefix):
  - `OPTIMIZELY_GRAPH_SINGLE_KEY`
  - `OPTIMIZELY_GRAPH_GATEWAY`
  - `OPTIMIZELY_CMS_URL`
- These should NOT be public (they're used server-side only)

**Solutions:**

```env
# .env file in project root (NOT packages/ or src/)
OPTIMIZELY_GRAPH_SINGLE_KEY=your-graph-key
OPTIMIZELY_GRAPH_GATEWAY=your-gateway-url
OPTIMIZELY_CMS_URL=https://your-cms.optimizely.com
```

**Important:**
- **Restart dev server** after changing `.env`
- **Check case sensitivity** - `OPTIMIZELY_CMS_URL` not `optimizely_cms_url`
- **No spaces around `=`** in .env file
- **No quotes** around values unless they contain spaces

## Diagnostic Approach

Follow this systematic sequence when troubleshooting:

### 1. Verify Preview Route Exists and Is Accessible

```bash
# Visit the route directly (without params)
http://localhost:3000/preview
```

**Expected:**
- Should not crash
- May show nothing or a message, but no error

### 2. Check Environment Variables

```bash
# Read the .env file
cat .env
```

**Verify:**
- All three required variables are set
- Values are correct (URLs, keys)
- No typos or extra characters

**Then:**
- Restart dev server completely
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### 3. Verify Route Implementation

Check preview route file has:

- ✅ `withAppContext` wrapper
- ✅ `<Script>` for communicationinjector.js
- ✅ `<PreviewComponent />`
- ✅ `<OptimizelyComponent />` or custom rendering
- ✅ Calls `getPreviewContent()`

### 4. Check CMS Configuration

In CMS Settings → Live Preview:

- ✅ Hostname configured
- ✅ Preview URL format enabled
- ✅ Preview URL points to correct route
- ✅ Preview tokens enabled
- ✅ URL format includes required parameters

### 5. Test with Browser Console Open

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Click preview** in CMS
4. **Watch for errors** (especially CORS, 404, network errors)
5. **Go to Network tab**
6. **Look for failed requests** (red/failed status)

## Success Criteria

Preview is working correctly when:

- ✅ Clicking "Preview" in CMS opens your application
- ✅ The content from CMS appears in the preview
- ✅ Changes in CMS update the preview in real-time
- ✅ No errors in browser console
- ✅ `communicationinjector.js` loads successfully
- ✅ Preview button is available for all content types

## Quick Checklist

Use this checklist for rapid diagnosis:

- [ ] Dev server is running
- [ ] `.env` file exists in project root with correct values
- [ ] Dev server was restarted after `.env` changes
- [ ] Preview route exists at expected path
- [ ] `withAppContext` wraps preview route
- [ ] `<Script>` tag for communicationinjector.js present
- [ ] `<PreviewComponent />` included in preview route
- [ ] Content types registered in `initReactComponentRegistry`
- [ ] CMS preview URL format configured
- [ ] CMS hostname matches dev server
- [ ] No CORS errors in console
- [ ] No 404 errors in network tab

## Advanced Debugging

### Enable Debug Logging

```tsx
// Add to preview route for debugging
console.log('Preview params:', searchParams);
console.log('Preview content:', content);
console.log('CMS URL:', process.env.OPTIMIZELY_CMS_URL);
```

### Check Network Requests

In DevTools Network tab, filter for:
- `communicationinjector.js` - Should load from CMS
- `preview` - Look for API calls to preview endpoint
- Failed requests (red) - Investigate each one

### Verify Content Type Registration

```tsx
// Add temporary logging
const registry = initReactComponentRegistry([...]);
console.log('Registered components:', registry);
```

## Getting Further Help

If preview still doesn't work after following this guide:

1. **Check SDK version** - Ensure you're using compatible versions
2. **Review CMS documentation** for version-specific preview setup
3. **Check for proxy/firewall** blocking CMS communication
4. **Try different browser** to rule out browser-specific issues
5. **Check CMS health** - Is the CMS itself accessible?
