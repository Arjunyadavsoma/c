# Cineby (TizenBrew) - module


## Local dev
1. Clone repo locally.
2. Serve a simple static server for local development if you want to load raw files (optional):
`npx http-server ./ -p 8080`


## Publish to GitHub
1. git init
2. git add .
3. git commit -m "Initial module"
4. gh repo create yourusername/cineby-tizen-module --public --source=. --remote=origin
5. git push -u origin main


## Install into TizenBrew
Two ways:


A) Using npm package name (preferred for published packages):
- Publish to npm as `@yourusername/cineby-tizen`.
- On your TV open TizenBrew -> Module Manager -> Add Module -> enter the npm package name.


B) Using GitHub repo directly:
- On your TV open TizenBrew -> Module Manager -> Add Module -> enter the GitHub URL `https://github.com/yourusername/cineby-tizen-module`.


## Test & Debug
- Use the Tizen Web Inspector or Chrome remote devtools for Samsung TV to inspect console logs.
- Add `console.log` in `inject/index.js` early to verify script runs.