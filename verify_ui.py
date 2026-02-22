from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the UI
        page.goto("http://localhost:4000")

        # Check title
        print(f"Title: {page.title()}")

        # Check inputs
        repo_path = page.locator("#repoPath")
        print(f"Repo Path default: {repo_path.input_value()}")

        # Fill inputs
        page.fill("#repoPath", "/app/sample-app")
        page.fill("#appUrl", "http://localhost:3000")
        page.check("#skipVoice")

        # Take screenshot of the form
        page.screenshot(path="verification_form.png")
        print("Screenshot saved to verification_form.png")

        # Click generate
        page.click("#generateBtn")

        # Wait for status update
        # Status starts at 'Idle', then 'Starting...', then 'Recording...'
        page.wait_for_selector("#status:has-text('Status: Starting...')")
        print("Status changed to Starting...")

        # Wait a bit
        page.wait_for_timeout(2000)

        # Take screenshot of progress
        page.screenshot(path="verification_progress.png")
        print("Screenshot saved to verification_progress.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
