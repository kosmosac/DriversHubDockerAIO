# Privacy and legal links

This deployment disables Google Analytics. The frontend still informs a new
visitor that essential cookies and local storage are used for authentication,
security, language preferences, and core functionality. The notice can be
dismissed with **Understood** and does not request consent for these necessary
functions.

Hub administrators can publish links to externally hosted legal documents in
**Administration → Configuration → Web**:

- Privacy Policy
- Cookie Policy
- Imprint

Each field is optional. Empty fields do not create a link. Configured links are
shown in the frontend footer, including on authentication pages. The cookie
notice links to the Cookie Policy when configured and otherwise to the Privacy
Policy. An Imprint alone is not linked from the cookie notice.

Use absolute HTTPS URLs. `http://localhost` is also accepted for local testing.
The backend rejects other HTTP URLs, relative URLs, and values longer than
2,048 characters.

The deployment provides the technical controls and links but does not provide
legal text. Operators remain responsible for publishing documents appropriate
for their deployment and jurisdiction.
