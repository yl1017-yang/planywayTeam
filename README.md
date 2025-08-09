# planywayTeam
https://yl1017-yang.github.io/planywayTeam/

## ✅ 프론트 - react

### 프로젝트 생성
npx create-react-app planyway

### 프론트 배포
npm install gh-pages --save-dev


--- package.json ----

"homepage": "https://yl1017-yang.github.io/planywayTeam/",

"predeploy": "npm run build",

"deploy": "gh-pages -d build"



## ✅ 백엔드 - Supabase 
https://supabase.com/dashboard/project/tadibqvctzbrpkisgyhx

https://rudaks.tistory.com/entry/supabase-%EB%B2%88%EC%97%AD-Supabase%EC%99%80-React-%ED%95%A8%EA%BB%98-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0-Use-Supabase-with-React

https://supabase.com/docs/guides/getting-started/quickstarts/reactjs

- 사용법

https://ramincoding.tistory.com/entry/Supabase-Supabase-%EB%A1%9C-%EB%B0%B1%EC%97%94%EB%93%9C-%EC%97%86%EC%9D%B4-Database-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0%EA%B8%B0%EB%B3%B8-%EC%82%AC%EC%9A%A9%EB%B2%95


- Supabase sql - 이벤트테이블

create table events (

  id uuid primary key default uuid_generate_v4(),

  title text not null,

  start_time timestamp not null,

  end_time timestamp not null,

  team text,

  label_id uuid null references labels(id),

  completed boolean default false,

  created_at timestamp default now()

);


- Supabase sql - 라벨테이블

create table labels (

  id uuid primary key default uuid_generate_v4(),

  label text not null,

  color text not null,

  created_at timestamp default now()
  
);




## ✅ fullcalendar 플러그인
https://fullcalendar.io/docs/react

### 설치 명령
// npm install @fullcalendar/react @fullcalendar/timegrid @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/core @supabase/supabase-js


## ✅ 구글 Calendar API
Google Cloud Console 
API Key 생성(Google Cloud → “Calendar API” 활성화 → API Key 발급)

https://heejoo0503.tistory.com/56 //스크립형식 공휴일


### `npm start`
### `npm run deplay`