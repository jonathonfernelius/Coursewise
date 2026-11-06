# Enable Coursewise profile photos

1. Open the Supabase project used by Coursewise, then open **SQL Editor**.
2. Paste the contents of `supabase/migrations/20261105000000_profile_photos.sql` and click **Run**. This creates the photo records, private storage bucket, and access policies. It does not change your existing tasks or friends functions.
3. Upload the updated website files to your hosting repository, including the new JavaScript and CSS files. Keep your existing Supabase configuration.
4. Reload Coursewise, open **Profile**, and choose **Add photo**. Pick a JPG, PNG, or WebP up to 10 MB, drag and resize the circular crop frame, and choose **Save photo**.

Photos appear in the profile card, the main app's navbar, and friends lists/details. **Change photo** opens a new crop preview. **Remove photo** restores initials. Images are cropped and converted to a 512 × 512 JPEG before upload; original image metadata is not retained.

Photos are available to signed-in Coursewise users, including people discovering new friends. Storage is private and images use temporary signed links. A user can upload, replace, and remove only their own photo. No new service-role key is needed in the website.

Without the SQL setup, the rest of Coursewise continues to work and shows initials. Uploading a photo will explain that setup is needed.

## Deployment checks

After applying the SQL, verify with two test accounts: upload and reload; see the photo from the other account's friends view; change the photo; remove it. Test in both light and dark mode and on a phone. Confirm that one account cannot write or delete objects in another account's folder. The delivered code was syntax-checked and its photo-loading/fallback behavior tested with mocked storage; live Supabase policies and uploads have not been executed from this workspace.

If you maintain a server-side account-deletion function, remove the user's objects from the `coursewise-avatars` bucket before deleting their Auth user. The photo record cascades on Auth deletion; Storage objects require explicit server-side cleanup.

## Crop editor update

The editor shows your full image, dims the area outside the circular crop, and lets you drag the frame and resize it using corner handles. A small preview shows the final avatar. Reset centers the crop again. Touch and keyboard controls are supported. The selected source image stays available during editing; only the cropped JPEG is uploaded. If photos already work, this update only needs the changed website files—no additional SQL.
