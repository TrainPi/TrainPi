#!/usr/bin/env python3
"""
Pre-Deployment Validation Checklist
Run this before pushing to GitHub and deploying
"""
import os
import sys

def check_file_exists(path, relative=False):
    """Check if file exists"""
    if relative:
        path = os.path.join(os.path.dirname(__file__), path)
    return os.path.exists(path)

def check_env_var(key, filename=".env"):
    """Check if env variable is set"""
    if filename == ".env":
        backend_env = os.path.join(os.path.dirname(__file__), "backend", ".env")
    else:
        backend_env = filename
    
    if not os.path.exists(backend_env):
        return None
    
    return key in open(backend_env).read()

print("🚀 TRAINPI DEPLOYMENT CHECKLIST")
print("=" * 70)

checks = {
    "✅ Project Structure": [
        ("Backend folder exists", lambda: check_file_exists("backend")),
        ("Frontend folder exists", lambda: check_file_exists("frontend")),
        ("Database configured", lambda: check_env_var("DATABASE_URL")),
    ],
    "🔑 API Keys": [
        ("Groq API key present", lambda: check_env_var("GROQ_API_KEY")),
        ("Google API key present", lambda: check_env_var("GOOGLE_API_KEY")),
        ("Secret key present", lambda: check_env_var("SECRET_KEY")),
    ],
    "📦 Backend Ready": [
        ("requirements.txt exists", lambda: check_file_exists("backend/requirements.txt")),
        ("run.py exists", lambda: check_file_exists("backend/run.py")),
        ("app.main exists", lambda: check_file_exists("backend/app/main.py")),
        (".env file exists", lambda: check_file_exists("backend/.env")),
    ],
    "🎨 Frontend Ready": [
        ("Next.js configured", lambda: check_file_exists("frontend/next.config.js")),
        ("package.json exists", lambda: check_file_exists("frontend/package.json")),
        ("tsconfig.json exists", lambda: check_file_exists("frontend/tsconfig.json")),
        (".env.local exists (optional)", lambda: check_file_exists("frontend/.env.local")),
    ],
    "🐳 Docker/Deployment": [
        ("Dockerfile exists (backend)", lambda: check_file_exists("backend/Dockerfile")),
        ("Dockerfile exists (frontend)", lambda: check_file_exists("frontend/Dockerfile")),
    ],
    "📋 Git Ready": [
        (".gitignore configured", lambda: check_file_exists(".gitignore")),
        ("Git initialized", lambda: check_file_exists(".git")),
    ],
}

all_passed = True
for category, category_checks in checks.items():
    print(f"\n{category}")
    print("-" * 70)
    
    for check_name, check_func in category_checks:
        try:
            result = check_func()
            icon = "✅" if result else "⚠️"
            status = "PASS" if result else "MISSING (optional)"
            print(f"  {icon} {check_name:.<45} {status}")
            
            if check_name in ["Groq API key present", "Database configured", "Backend folder exists", "Frontend folder exists"]:
                if not result:
                    all_passed = False
        except Exception as e:
            print(f"  ❌ {check_name:.<45} ERROR: {e}")
            all_passed = False

print("\n" + "=" * 70)
print("📝 DEPLOYMENT STEPS")
print("=" * 70)

steps = [
    "1. Verify all GREEN checkmarks above",
    "2. Update backend/.env DATABASE_URL (production)",
    "3. Update backend/.env SECRET_KEY (strong random key)",
    "4. Update frontend/.env.local NEXT_PUBLIC_API_URL (backend domain)",
    "5. Run: git add . && git commit -m 'Prepare for deployment'",
    "6. Run: git push origin main",
    "7. Go to Vercel dashboard for frontend",
    "8. Go to Railway/Render dashboard for backend",
    "9. Add all environment variables to both platforms",
    "10. Wait for automatic deployment",
]

for step in steps:
    print(f"  {step}")

print("\n" + "=" * 70)
if all_passed:
    print("✅ PROJECT READY FOR DEPLOYMENT!")
    print("\nNext steps:")
    print("  1. Push code: git push origin main")
    print("  2. Deploy frontend: Vercel (auto-deploys on push)")
    print("  3. Deploy backend: Railway/Render (auto-deploys on push)")
    sys.exit(0)
else:
    print("❌ REQUIRED FILES/KEYS MISSING!")
    print("\nFix the errors above before deploying.")
    sys.exit(1)