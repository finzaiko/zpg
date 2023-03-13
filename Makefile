
start-dev:
	npm run dev

start-dev-desktop:
	cd desktop && npm run start-electron

build-desktop:
	cd frontend && npm run build-desktop
	cd desktop && npm run build

clean:
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf desktop/dist
	rm -rf desktop/compare.sqlite
	rm -rf desktop/db.sqlite

install:
	npm i
	cd backend && npm i
	cd frontend && npm i
	cd desktop && npm i
	cd backend && cp .env.example .env


build-docker:
	cd frontend && npm run build-docker
	docker build -t finzaiko/zpg:1.0 backend/.

run-docker:
	docker run --rm --name zpg -p 9001:9000 -d -e "API_SERVER=http://localhost:9001" finzaiko/zpg:1.0

push-docker-hub:
	docker push finzaiko/zpg:1.0
