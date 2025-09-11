# S3 Integration Setup Guide

This guide will help you set up AWS S3 integration for the Snappy application.

## Prerequisites

1. AWS Account
2. AWS CLI installed and configured (optional, for easier setup)

## Step 1: Create S3 Bucket

1. Log in to AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Choose a unique bucket name (e.g., `snappy-uploads-yourname`)
5. Select your preferred region
6. Keep default settings for public access (we'll handle this with ACL)
7. Click "Create bucket"

## Step 2: Configure Bucket Permissions

1. Go to your bucket's "Permissions" tab
2. Under "Block public access", click "Edit"
3. Uncheck "Block all public access" (we need this for public image access)
4. Check the confirmation box and save
5. **Important**: Under "Object Ownership", make sure "ACLs disabled" is selected (this is the default for new buckets)
6. Under "Bucket policy", add the following policy (replace `YOUR_BUCKET_NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

## Step 3: Create IAM User

1. Go to IAM service in AWS Console
2. Click "Users" → "Create user"
3. Enter username (e.g., `snappy-s3-user`)
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and select "AmazonS3FullAccess" (or create a custom policy with minimal permissions)
8. Click "Next: Tags" (optional)
9. Click "Next: Review"
10. Click "Create user"
11. **Important**: Copy the Access Key ID and Secret Access Key - you'll need these for the environment variables

## Step 4: Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
S3_BUCKET_NAME=your_bucket_name_here
S3_BASE_URL=https://your_bucket_name_here.s3.amazonaws.com
```

Replace the values with your actual AWS credentials and bucket information.

## Step 5: Test the Integration

1. Start the backend server: `npm run dev`
2. Test the upload endpoint using the frontend or a tool like Postman
3. Check your S3 bucket to verify files are being uploaded

## Security Considerations

1. **Never commit your `.env` file** - it contains sensitive credentials
2. **Use IAM roles in production** instead of access keys when possible
3. **Limit S3 permissions** to only what's needed (read/write to specific bucket)
4. **Consider using CloudFront** for better performance and security

## Troubleshooting

### Common Issues

1. **Access Denied**: Check your IAM user permissions and bucket policy
2. **Bucket not found**: Verify the bucket name and region
3. **CORS errors**: Add CORS configuration to your S3 bucket if needed
4. **AccessControlListNotSupported**: This error occurs when ACLs are disabled on your bucket. The application is configured to work with ACLs disabled (which is the default for new buckets). Make sure "ACLs disabled" is selected in your bucket's Object Ownership settings.

### CORS Configuration (if needed)

If you encounter CORS issues, add this configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Production Deployment

For production deployment:

1. Use environment variables in your deployment platform
2. Consider using AWS IAM roles instead of access keys
3. Set up CloudFront distribution for better performance
4. Implement proper error handling and logging
5. Consider using AWS Secrets Manager for credential management

## File Structure

Files uploaded to S3 will be organized as follows:
- `uploads/image-{unique-hash}.{extension}` - Regular uploads
- `stories/image-{unique-hash}.{extension}` - Story-specific uploads (if implemented)

The S3 service automatically generates unique filenames to prevent conflicts.
