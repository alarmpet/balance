---
type: project
date: 2026-06-03
status: active
author: Antigravity
---

# Balance Island Overview

## Summary

Balance Island는 사용자가 일상적인 선택(밸런스 게임)을 통해 자신의 성향을 탐색하고, 이에 따라 가상의 펫을 케어하며 자신만의 섬을 성장시키는 **"놀면서 나를 발견하는 게임형 자기발견 서비스"**입니다.

## Context

이 프로젝트는 단순한 성향 진단 도구(예: 일회성 MBTI 테스트)를 넘어, 매일의 미세한 선택 데이터를 축적하여 사용자의 심층 가치관을 다각도로 매핑하고 시각화하는 지속적인 경험을 제공하고자 합니다. Obsidian의 그래프 뷰와 마인드맵의 장점을 공간 메타포(성장하는 섬, 별자리 지도)로 변환하여 모바일에서 극대화합니다.

## Technical Stack

- **Frontend Core:** React Native, Expo SDK 51, Expo Router (file-based routing)
- **Styling:** Vanilla CSS / React Native StyleSheet
- **Backend/DB:** Supabase (Auth, PostgreSQL, Database Triggers, Row-Level Security, RPC Functions, Edge Functions)
- **AI/Vector:** OpenAI API (Edge Functions 호출을 통한 성향 분석 및 임베딩 처리)
- **Deployment:** Vercel (Production Web Hosting)

## Key Features

1. **선택 피드 (Balance Game Feed):**
   - 2지선다 형태의 카드식 피드.
   - Supabase RPC(`submit_vote`, `submit_reaction`)를 통해 실시간 투표 데이터를 기록하고, 사용자 프로필의 trait(성향) 점수 누적.
2. **다마구찌형 펫 케어 (Pet Care System):**
   - 사용자의 성향을 대변하는 펫(예: 비숑, 푸들 등) 케어 시스템.
   - 투표 및 돌봄 행동에 따라 펫의 기분(mood), 에너지(energy)가 변화하며 성격적인 피드백(말풍선, 일기) 제공.
   - 펫 진화 및 변이 시스템.
3. **인사이트 맵 (Insight Map):**
   - BIPI 4축 성향 데이터를 기반으로 한 개인 성향 시각화.
   - "오늘의 발견", "성향 가지" 마인드맵, 그리고 Obsidian Local Graph 형태의 "별자리 연결 지도"를 지원.
4. **소셜 로그인 및 보안 (OAuth/Magic Link):**
   - Google 및 Kakao 소셜 로그인 연동 (`/auth/callback` 흐름).
   - 이메일 매직 링크 로그인 지원.
   - Supabase RLS(Row-Level Security) 및 RPC-only 트랜잭션 설계를 통한 강력한 경제/보안 구조 구축.

## Links

- [[CLAUDE]] — 에이전트 개발 규칙
- [[index]] — 볼트 지도
- [[AI-Sessions/wiki/sources/2026-06-03-comprehensive-review|2026-06-03 종합 리뷰 문서]]
- [[AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review|2026-06-03 펫 아일랜드 라이브옵스 업그레이드 리뷰]]
- [[research]] — 현재 프로젝트 상태 및 리스크 목록
- [[timeline]] — 개발 타임라인
