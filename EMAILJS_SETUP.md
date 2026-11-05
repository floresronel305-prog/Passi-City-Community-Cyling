# Forgot password -> code sent to Gmail (EmailJS, free)

1. Sign up at https://www.emailjs.com
2. Email Services > Add New Service > **Gmail** > connect your Gmail account. Copy the **Service ID**.
3. Email Templates > Create New Template:
   - To Email: `{{to_email}}`
   - Subject: `Your Passi City Community Cycling reset code`
   - Content: `Hi {{name}}, your password reset code is {{code}}. It expires in 10 minutes.`
   - Save, then copy the **Template ID**.
4. Account > General: copy your **Public Key**.
5. Open `app.js` and fill in:
   `const EMAILJS = { publicKey:"...", serviceId:"...", templateId:"..." };`
6. In EmailJS > Account > Security, you may add your site domain to the allowed list.

Free plan: about 200 emails per month.
