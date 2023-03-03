
start-dev:
	npm run dev

start-dev-desktop:
	cd desktop && npm run start-electron

clean:
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf frontend/node_modules

install:
	npm i
	cd backend && npm i
	cd frontend && npm i
	cd desktop && npm i
	cd backend && cp .env.example .env


