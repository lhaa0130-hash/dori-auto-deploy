// 서버에서만 실행되도록 설정
import 'server-only';
// GitHub API를 사용하기 위한 라이브러리
import { Octokit } from 'octokit';
import { GoogleGenerativeAI } from "@google/genai"; // 👈 이 import는 그대로 유지
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs';

// ----------------------------------------------------
// 1. 초기 설정 (환경 변수에서 비밀 키를 가져옵니다)
// ----------------------------------------------------

// GitHub 토큰과 레포지토리 정보 (Day 6-1에서 등록)
const githubToken = process.env.GITHUB_TOKEN;
const owner = "lhaa0130-hash"; // ⚠️ 여기에 사용자님의 GitHub ID를 입력해주세요!
const repo = "dori-auto-deploy";
const branch = "main";

// Gemini API 키 설정 (Day 6-2에서 등록)
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Octokit 초기화
const octokit = new Octokit({ auth: githubToken });

// CSS 파일 경로
const themeFilePath = 'app/globals.css';

// ... (중략 - 나머지 코드는 모두 이전과 동일합니다) ...
// ... (중략 - 나머지 코드는 모두 이전과 동일합니다) ...

// ----------------------------------------------------
// 5. Next.js API의 메인 처리 함수 (POST 요청)
// ----------------------------------------------------
export async function POST(request: Request) {
    try {
        // 사용자로부터 명령을 받습니다. (예: "하늘색으로 바꿔줘")
        const { command } = await request.json(); 

        if (!command || typeof command !== 'string') {
            return new Response(JSON.stringify({ success: false, error: '유효한 명령(command)이 필요합니다.' }), { status: 400 });
        }

        // 1. 현재 CSS 파일 내용 가져오기
        const { content: currentCssContent, sha: currentSha } = await getThemeFile();

        // 2. Gemini에게 수정 요청
        const newCssContent = await requestGeminiThemeUpdate(currentCssContent, command);

        // 3. GitHub에 커밋
        const commitResult = await commitFile(newCssContent, currentSha, command);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `테마가 성공적으로 변경되었습니다. 커밋: ${commitResult.commit.sha}`,
            vercel_url: `https://dori-auto-deploy.vercel.app` 
        }), { status: 200 });

    } catch (error) {
        console.error("API 처리 중 오류 발생:", error);
        return new Response(JSON.stringify({ success: false, error: '서버 처리 오류가 발생했습니다.' }), { status: 500 });
    }
}

// ----------------------------------------------------
// 2~4번 함수 코드는 이전과 동일하게 유지되어야 합니다.
// GitHub 웹 편집기에서는 이 코드를 전부 붙여넣으셔야 합니다.
// (이전 코드 목록에서 2~4번 함수의 코드를 가져와 붙여넣으셔야 합니다.)
// ----------------------------------------------------

async function getThemeFile() {
    const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path: themeFilePath,
        ref: branch,
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });

    // 파일 내용을 Base64 디코딩하여 텍스트로 반환
    return {
        content: Buffer.from((fileData as { content: string }).content, 'base64').toString('utf8'),
        sha: (fileData as { sha: string }).sha // 파일 업데이트에 필요한 SHA 값
    };
}

async function requestGeminiThemeUpdate(cssContent: string, command: string) {
    // Gemini에게 보낼 프롬프트 (명령어)
    const prompt = `
    사용자의 명령을 기반으로 주어진 CSS 내용(globals.css)을 수정해야 합니다. 
    당신의 임무는 요청된 변경 사항만 반영된 **새로운 CSS 코드 전체**를 응답하는 것입니다.
    **절대 설명이나 추가 텍스트를 포함하지 말고, 오직 완성된 CSS 코드만 응답하세요.**

    ---
    CSS 코드:
    ${cssContent}
    ---

    사용자 명령: "${command}"

    새로운 CSS 코드:
    `;

    const result = await model.generateContent(prompt);
    return result.text.trim();
}

async function commitFile(newContent: string, sha: string, command: string) {
    // 변경된 내용을 Base64 인코딩합니다.
    const contentEncoded = Buffer.from(newContent, 'utf8').toString('base64');

    const commitMessage = `Day 6: [AI] ${command} 명령으로 테마 변경`;

    const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path: themeFilePath,
        message: commitMessage,
        content: contentEncoded,
        sha: sha, // 기존 파일의 SHA 값을 넘겨야 업데이트 가능
        branch,
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });

    return response.data;
}
