
start-dev-server:
	npm run dev

clean:
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf frontend/node_modules

install:
	npm i
	cd backend && npm i
	cd frontend && npm i
	cd backend && mv .env.example .env
