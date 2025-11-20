# Testing Guide for Event Posting Fix

## What Was Fixed

### Problem
When posting a food event, users received the error: "Failed to post event. Check console for details."

### Root Cause
1. Backend required at least one image URL, but image uploads could fail silently
2. No proper error handling for failed image uploads
3. Missing `REACT_APP_API_URL` in client environment variables

### Changes Made

#### 1. Backend (`server/controllers/eventsController.js`)
- **Made images optional**: Removed the requirement that `image_urls.length > 0`
- **Better validation**: Added detailed error messages showing which fields are missing
- **Flexible validation**: Now accepts empty array for `image_urls` if uploads fail

#### 2. Frontend (`client/src/pages/PostEvent/PostEvent.js`)
- **Improved error handling**: Better tracking of failed image uploads
- **User feedback**: Shows confirmation dialogs when some/all images fail to upload
- **Better error messages**: Displays specific error details from the server
- **Made images optional**: Removed `required` attribute from file input
- **Updated label**: Changed from "Upload Event Images *" to "Upload Event Images (Optional)"

#### 3. Environment Configuration
- **Added `REACT_APP_API_URL`** to `client/.env.local` with value `http://localhost:5001`

## How to Test

### Prerequisites
✅ Backend server running on http://localhost:5001
✅ Frontend server running on http://localhost:3000
✅ You must be logged in to post events

### Test Cases

#### Test Case 1: Post Event WITH Images (Happy Path)
1. Navigate to http://localhost:3000
2. Log in to your account
3. Go to "Post Event" page
4. Fill in all required fields:
   - Event Title
   - Location
   - Date
   - Time
   - Food Items & Quantities
   - Total Serving Capacity
   - Dietary Options (select at least one)
5. Upload 1-3 images
6. Click "Post Event"

**Expected Result:**
- Images upload successfully
- Event is created
- Success message: "✅ Event posted successfully!"
- Redirected to Events page
- Event appears with images

#### Test Case 2: Post Event WITHOUT Images
1. Follow steps 1-4 from Test Case 1
2. **Do NOT upload any images**
3. Click "Post Event"

**Expected Result:**
- Event is created without images
- Success message: "✅ Event posted successfully!"
- Redirected to Events page
- Event appears (no images shown)

#### Test Case 3: Image Upload Failure (If Storage Bucket Doesn't Exist)
1. Follow steps 1-4 from Test Case 1
2. Upload images
3. Click "Post Event"

**If `event_images` bucket doesn't exist:**
- Alert appears: "⚠️ All image uploads failed..."
- Offers option to post without images
- If you click "OK", event posts successfully without images

#### Test Case 4: Mixed Success/Failure
(Only possible if storage bucket exists but some uploads fail)
- Shows confirmation dialog listing failed uploads
- Asks if you want to continue
- Posts with successfully uploaded images only

### Verifying the Fix

#### Check Console Logs
Open browser console (F12 or Cmd+Option+I) and look for:
- `✅ Supabase client initialized` - Supabase is connected
- `Submitting event: {...}` - Event data being sent
- No "Supabase credentials not configured" warnings

#### Check Network Tab
1. Open DevTools → Network tab
2. Post an event
3. Look for POST request to `http://localhost:5001/api/events`
4. Check response:
   - Status: `201 Created` (success)
   - Response body should contain the created event

#### Check Server Logs
In the terminal running the backend, you should see:
```
🚀 Server is running on port 5001
📡 API available at http://localhost:5001
Supabase client initialized with URL: https://wgyrpqwzmruwvpqfpqpo.supabase.co
```

## Troubleshooting

### If images still fail to upload:
1. Check if `event_images` storage bucket exists in Supabase:
   - Go to https://app.supabase.com
   - Navigate to Storage
   - Create a new bucket named `event_images`
   - Set it to Public
   - Enable File Upload

### If you get "You must be logged in":
- Make sure you're logged in
- Check browser console for auth errors
- Try logging out and back in

### If events don't appear:
- Check the Events page
- Verify the event was created in Supabase dashboard
- Check browser console for errors

## Notes
- Images are now **optional** - events can be posted without images
- The system gracefully handles image upload failures
- Users are notified if images fail to upload
- Events can still be posted even if all images fail
