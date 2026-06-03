---
type: concept
date: 2026-06-03
status: active
author: Antigravity
---

# Pet Care and Evolution System

## Summary

`Pet Care and Evolution System`은 사용자의 성향과 매칭되는 동반자 펫을 돌보고 진화시키는 다마구찌 스타일의 감성 육성 시스템입니다. 사용자의 투표(선택)가 펫의 행동, 대사, 일기 형태로 즉각 반영되는 유기적 루프를 형성합니다.

## Context

단순히 수치(Mood, Energy)만 갱신하는 정적인 시스템을 탈피하여, 펫과의 감정적 교감을 극대화하고 사용자가 매일 앱에 돌아와 펫을 확인하고 싶게 만드는 **핵심 리텐션 엔진** 역할을 수행합니다.

## Details

### 1. 펫 핵심 상태값 (Core States)

- **기분 (Mood):** 펫의 감정적 만족도. 매일 접속하여 돌보지 않으면 서서히 하락합니다. (벌을 주기보다는 보고 싶어 하는 감정적 자극으로 접근)
- **에너지 (Energy):** 펫의 활동성. 사용자가 밸런스 피드 질문에 투표를 완료하면 상승합니다.
- **친밀도 (Bond):** 펫과의 유대감. 조개 재화를 사용하여 케어 행동(간식 주기, 놀아주기, 칭찬하기 등)을 할 때 상승합니다.
- **스타일 점수 (Style Score):** 아바타 상점에서 구매한 액세서리를 장착할 때 부여되는 보너스 스코어.

### 2. 진화 단계 (Evolution Stages)

투표 참여 횟수(누적 컨텍스트)에 따라 펫이 성장하고 형태가 진화합니다.

1. **알 (Egg):** 0~9회 투표.
2. **새싹 (Sprout):** 10회 투표 완료 (첫 부화 및 성향 타입 결정).
3. **탐험가 (Explorer):** 50회 투표 완료.
4. **섬지기 (Island Keeper):** 100회 투표 완료.
5. **전설 (Legendary):** 300회 투표 완료 (특별 이펙트 및 전용 데코 언락).

### 3. 성향 반응 및 대화 (Personality Responses)

최근 투표 흐름에 따라 펫의 대사와 표현이 동적으로 결정됩니다.

- **성향 연속 선택 (Streak):** 예컨대 모험(`adventure`) 성향을 3회 연속 선택하면, 펫이 "오늘 뭔가 새로운 거 해보고 싶은 기분이야! ⛰️" 같은 말풍선을 띄웁니다.
- **감정적 환영 (Welcome back):** 3일 이상 미접속 후 복귀 시 벌을 주기보단 반겨주는 표정과 대사("기다리고 있었어! 다시 봐서 정말 기뻐 🌟")를 출력합니다.

### 4. 펫 일기 시스템 (Pet's Diary)

- 매일 밤 펫이 사용자의 오늘의 선택과 성향 변화를 기반으로 작성하는 1인칭 관점의 짧은 일기입니다.
- 단순한 데이터 통계를 텍스트로 풀어내어 감성적인 인사이트(예: "오늘 주인이 계획보단 흐름을 선택했어. 나도 파도 타는 자유인이 된 느낌이야!")를 제공하며, 이는 `user_insight_cards` 및 Obsidian 위키 개념의 핵심 연결고리가 됩니다.

## Links

- [[AI-Sessions/wiki/projects/balance-island-overview|Balance Island Overview]]
- [[AI-Sessions/wiki/concepts/bipi-personality-system|BIPI Personality System]]
- [[AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review|2026-06-03 LiveOps & Economy Upgrade Review]]
