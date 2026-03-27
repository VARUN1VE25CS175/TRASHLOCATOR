# Admin Portal Access

## Overview
The admin portal is a separate, secure interface for managing dustbin locations. It is **not visible** on the public map view and can only be accessed via direct URL navigation.

## Accessing the Admin Portal

### URL
```
/admin/login
```

**Full URL Example:**
```
https://your-domain.com/admin/login
```

### Default Credentials
- **Password:** `admin123`

## Admin Features

### 1. Dashboard Access
After login, admins are redirected to `/admin/dashboard` where they can:

### 2. Dustbin Management (CRUD Operations)
- **Add New Dustbin**
  - Visual map-based location picker
  - Pin locations directly on the map
  - Use current location button
  - Manual coordinate entry
  
- **Edit Dustbin**
  - Update name, description, and location
  - View current location on map
  
- **Delete Dustbin**
  - Remove dustbins with confirmation prompt

### 3. Location Input Methods
Admins have three ways to specify dustbin locations:

1. **Pin on Map** (Visual Picker)
   - Click anywhere on the interactive map
   - Orange pin marker appears
   - Coordinates auto-populate

2. **Use Current Location**
   - Automatically detects admin's GPS location
   - One-click location capture

3. **Manual Entry**
   - Enter latitude and longitude directly
   - Useful for precise coordinates

## Security

### Access Control
- Admin routes are protected by authentication
- Token-based session management
- All admin API endpoints require authorization header
- Public users cannot see admin interface elements

### Hidden from Public View
- No admin buttons or links on public map
- Admin portal accessible only via direct URL
- Separate branding for admin interface

## Public vs Admin Interface

| Feature | Public View | Admin Portal |
|---------|-------------|--------------|
| View dustbins on map | ✅ Yes | ✅ Yes |
| Get directions | ✅ Yes | ✅ Yes |
| Find nearest dustbin | ✅ Yes | ✅ Yes |
| Add/Edit/Delete dustbins | ❌ No | ✅ Yes |
| Map location picker | ❌ No | ✅ Yes |
| Admin controls | ❌ No | ✅ Yes |

## Navigation

### From Public Map to Admin
- Admin must manually navigate to `/admin/login`
- No visible link on public interface

### From Admin to Public Map
- Click "Public Map" button in admin header
- Returns to public view

## Technical Details

### Routes
- `/` - Public map view
- `/admin/login` - Admin login page
- `/admin/dashboard` - Admin management dashboard

### Authentication Flow
1. Navigate to `/admin/login`
2. Enter password (admin123)
3. Receive authentication token
4. Token stored in localStorage
5. Redirected to `/admin/dashboard`
6. Protected routes check token validity

### API Endpoints
All admin endpoints require `Authorization: Bearer {token}` header:
- `POST /api/admin/login` - Authenticate admin
- `POST /api/dustbins` - Create dustbin (admin only)
- `PUT /api/dustbins/{id}` - Update dustbin (admin only)
- `DELETE /api/dustbins/{id}` - Delete dustbin (admin only)

## Best Practices

1. **Keep URL Private**
   - Share `/admin/login` URL only with authorized admins
   - Consider changing default password in production

2. **Secure Password**
   - Change default password `admin123` to strong password
   - Update `ADMIN_PASSWORD` in `/app/backend/server.py`

3. **HTTPS Required**
   - Always use HTTPS in production
   - Protect token transmission

4. **Logout When Done**
   - Always logout after admin tasks
   - Clears authentication token

## Troubleshooting

### Cannot Access Admin Portal
- Verify URL is `/admin/login` (not `/admin`)
- Check browser console for errors
- Clear localStorage and try again

### Unauthorized Errors
- Ensure you're logged in
- Check token in localStorage
- Re-login if session expired

### Map Picker Not Working
- Check browser location permissions
- Verify internet connection (OpenStreetMap tiles)
- Try refreshing the page

## Support
For issues or questions about the admin portal, refer to the main application documentation or contact the development team.
