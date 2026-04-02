#!/usr/bin/env python3
"""
Test SMTP Configuration for Forgot Password Email Feature
Run: python test_smtp.py
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_smtp_connection():
    """Test if SMTP configuration works"""
    
    print("=" * 60)
    print("🔍 TESTING SMTP CONFIGURATION")
    print("=" * 60)
    
    # Get environment variables
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM")
    
    print("\n📋 Configuration Found:")
    print(f"  SMTP_HOST: {smtp_host}")
    print(f"  SMTP_PORT: {smtp_port}")
    print(f"  SMTP_USER: {smtp_user}")
    print(f"  SMTP_FROM: {smtp_from}")
    print(f"  SMTP_PASSWORD: {'✓ Set' if smtp_password else '✗ NOT SET'}")
    
    # Validate
    if not all([smtp_host, smtp_user, smtp_password, smtp_from]):
        print("\n❌ ERROR: Missing SMTP configuration!")
        print("Please set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in .env")
        return False
    
    # Test connection
    try:
        print("\n🔗 Testing SMTP Connection...")
        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        print("  ✓ Connected to SMTP server")
        print("  ✓ TLS enabled")
        
        print("\n🔑 Testing Authentication...")
        server.login(smtp_user, smtp_password)
        print(f"  ✓ Logged in as {smtp_user}")
        
        server.quit()
        print("\n✅ SMTP Configuration is VALID!")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print("\n❌ ERROR: Authentication failed!")
        print("   Check your SMTP_USER and SMTP_PASSWORD")
        if smtp_user.endswith("@gmail.com"):
            print("   💡 For Gmail: Use App Password (not regular password)")
            print("   💡 Ensure 2FA is enabled: https://myaccount.google.com/security")
        return False
        
    except smtplib.SMTPException as e:
        print(f"\n❌ ERROR: SMTP Error: {e}")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        return False


def test_send_email():
    """Test sending an actual email"""
    
    print("\n" + "=" * 60)
    print("📧 TESTING EMAIL SEND")
    print("=" * 60)
    
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM")
    
    to_email = input("\n📩 Enter test email address to send to: ").strip()
    
    if not to_email:
        print("❌ No email provided. Skipping email send test.")
        return
    
    print(f"\n📤 Sending test email to {to_email}...")
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "TrainPi – SMTP Configuration Test"
        msg["From"] = smtp_from
        msg["To"] = to_email
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #4f46e5;">✅ SMTP Configuration Test</h2>
                <p>If you received this email, your SMTP configuration is working correctly!</p>
                <p><strong>Test Details:</strong></p>
                <ul>
                    <li>From: {smtp_from}</li>
                    <li>To: {to_email}</li>
                    <li>Server: {smtp_host}:{smtp_port}</li>
                    <li>Time: {os.popen('date').read().strip()}</li>
                </ul>
                <p>You can now use the Forgot Password feature in your TrainPi portal!</p>
                <hr>
                <p style="color: #666; font-size: 0.9em;">This is a test email from your TrainPi backend.</p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, "html"))
        
        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        
        print(f"✅ Email sent successfully to {to_email}!")
        print("💡 Check your inbox (and spam folder)")
        
    except Exception as e:
        print(f"❌ ERROR: Failed to send email: {e}")


if __name__ == "__main__":
    # Test connection
    if test_smtp_connection():
        # Offer to test email send
        test = input("\n🤔 Test sending an email? (yes/no): ").strip().lower()
        if test.startswith('y'):
            test_send_email()
    
    print("\n" + "=" * 60)
    print("✨ Testing complete!")
    print("=" * 60)
