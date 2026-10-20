import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:/Users/akshita sharda/Documents/ChatGPT/STUDYFORGE_AI";
const SKILL_DIR = "C:/Users/akshita sharda/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations";
const buildDir = path.join(workspaceDir, "ppt-build");
const FINAL_PPTX = path.join(workspaceDir, "ppt-output", "StudyForge_Midterm_Project_Display_Final.pptx");
const RUNTIME_PYTHON = "C:/Users/akshita sharda/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const { resolvePresentationFont, finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href);
const family = resolvePresentationFont();
const W = 1280, H = 720;
const C = { ivory:"#FAF7F0", paper:"#FFFDF9", ink:"#251C35", muted:"#655E70", plum:"#55315F", lavender:"#A78BFA", lilac:"#EAE1FF", peach:"#F6C9A8", mint:"#CDE8D7", line:"#DDD4E7", white:"#FFFFFF" };
const dataDir = path.join(workspaceDir, "ASHIEY", "data");
const assets = {
  home: path.join(dataDir, "stitch-home.png"), chat: path.join(dataDir, "stitch-chat.png"), avatar: path.join(dataDir, "stitch-avatar.png"), planner: path.join(dataDir, "stitch-planner.png"), study: path.join(dataDir, "study-chat-desktop.png"), profile: path.join(dataDir, "profile-setup.png"), dark: path.join(dataDir, "dark-dashboard.png"), darkProfile: path.join(dataDir, "dark-profile.png")
};
const imageBytes = {};
for (const [k,v] of Object.entries(assets)) imageBytes[k] = new Uint8Array(await fs.readFile(v));

const p = Presentation.create({ slideSize:{width:W,height:H} });
function base(slide, n, speaker){
  slide.background.fill = C.ivory;
  slide.shapes.add({geometry:"rect",position:{left:0,top:0,width:W,height:18},fill:C.plum,line:{fill:"none",width:0}});
  slide.shapes.add({geometry:"line",position:{left:56,top:670,width:1168,height:0},fill:"none",line:{style:"solid",fill:C.line,width:1}});
  tx(slide, `STUDYFORGE AI   /   MID-TERM DISPLAY`, 56,681,440,20,11,C.muted,true);
  tx(slide, `${String(n).padStart(2,"0")}  ·  Suggested speaker: ${speaker}`, 850,681,374,20,11,C.muted,false,"right");
}
function tx(slide,text,left,top,width,height,size,color=C.ink,bold=false,align="left"){
  const s=slide.shapes.add({geometry:"textbox",position:{left,top,width,height},fill:"none",line:{fill:"none",width:0}});
  s.text=text; s.text.style={typeface:family,fontSize:size,bold,color,autoFit:"shrink",paragraphAlignment:align}; return s;
}
function title(slide, kicker, heading, sub=""){
  tx(slide,kicker.toUpperCase(),56,54,440,22,12,C.plum,true);
  tx(slide,heading,56,82,840,82,34,C.ink,true);
  if(sub) tx(slide,sub,56,171,820,42,17,C.muted,false);
}
function label(slide,text,left,top,width,fill=C.lilac){
  const s=slide.shapes.add({geometry:"roundRect",position:{left,top,width,height:30},fill,line:{fill:"none",width:0},borderRadius:"rounded-full"});
  s.text=text; s.text.style={typeface:family,fontSize:12,bold:true,color:C.plum,autoFit:"shrink",paragraphAlignment:"center"}; return s;
}
function line(slide,left,top,width,color=C.lavender,thick=3){slide.shapes.add({geometry:"line",position:{left,top,width,height:0},fill:"none",line:{style:"solid",fill:color,width:thick}})}
function bullet(slide,text,left,top,width,accent=C.lavender){
  slide.shapes.add({geometry:"ellipse",position:{left,top:top+8,width:10,height:10},fill:accent,line:{fill:"none",width:0}});
  tx(slide,text,left+22,top,width-22,48,18,C.ink,false);
}
function photo(slide,key,left,top,width,height,alt){
  slide.images.add({blob:imageBytes[key],contentType:"image/png",alt,fit:"cover",position:{left,top,width,height},geometry:"roundRect",borderRadius:"rounded-2xl"});
  slide.shapes.add({geometry:"roundRect",position:{left,top,width,height},fill:"none",line:{style:"solid",fill:C.plum,width:1},borderRadius:"rounded-2xl"});
}
function note(slide, text){slide.speakerNotes.textFrame.setText(`Source: StudyForge repository implementation and local product screenshots.\n\nPresenter cue: ${text}`)}
function step(slide,num,head,body,left,top,width,fill){
  slide.shapes.add({geometry:"roundRect",position:{left,top,width,height:132},fill,line:{style:"solid",fill:C.line,width:1},borderRadius:"rounded-2xl"});
  tx(slide,num,left+20,top+16,36,25,15,C.plum,true);
  tx(slide,head,left+20,top+47,width-40,28,19,C.ink,true);
  tx(slide,body,left+20,top+79,width-40,39,14,C.muted,false);
}

// 1
{const s=p.slides.add(); s.background.fill=C.plum; s.shapes.add({geometry:"ellipse",position:{left:868,top:-142,width:520,height:520},fill:C.lavender,line:{fill:"none",width:0}}); s.shapes.add({geometry:"ellipse",position:{left:970,top:-38,width:310,height:310},fill:C.peach,line:{fill:"none",width:0}}); s.shapes.add({geometry:"roundRect",position:{left:56,top:55,width:238,height:32},fill:"#FFFFFF/18",line:{fill:"#FFFFFF/25",width:1},borderRadius:"rounded-full"}); tx(s,"MID-TERM PROJECT DISPLAY",72,63,210,16,12,C.white,true); tx(s,"StudyForge AI",56,144,680,85,54,C.white,true); tx(s,"A focused study companion that turns learning material into organised practice.",60,244,610,64,23,"#F3EFFF",false); photo(s,"home",732,205,458,302,"StudyForge home screen"); tx(s,"Akshita  ·  Aasveer Singh  ·  Manik Jasrotia",60,589,780,30,19,C.white,true); tx(s,"B.Tech project presentation",60,626,350,24,15,"#E8DDF4",false); note(s,"Open by introducing the project name and each team member. State that Manik will present the frontend-only section.");}
// 2
{const s=p.slides.add();base(s,2,"Akshita");title(s,"The need","Students need one calm place to learn, practice and ask.","Study material is commonly scattered across PDFs, notes, search tabs and separate quiz tools."); photo(s,"study",760,96,440,442,"Study assistant screen"); bullet(s,"Revision becomes slower when key points are hidden inside long notes.",60,260,610,C.peach); bullet(s,"Generic practice questions repeat ideas and do not reflect the uploaded material.",60,340,610,C.lavender); bullet(s,"Students also need a simple way to track tasks, chat about a topic and return to their work.",60,420,610,C.mint); label(s,"DESIGNED FOR B.TECH STUDENTS",60,540,284,C.lilac); note(s,"Explain the student problem before discussing technology. Use the screenshot only as evidence of the learning workspace.");}
//3
{const s=p.slides.add();base(s,3,"Akshita");title(s,"Project objective","Make study actions feel connected.","StudyForge brings material, AI assistance and personal organisation into one web application."); step(s,"01","Collect","Upload PDFs and keep study material available in a personal workspace.",60,260,235,C.lilac); step(s,"02","Understand","Ask questions grounded in the selected study material.",322,260,235,C.mint); step(s,"03","Practice","Generate flashcards and quizzes with broader, less repetitive coverage.",584,260,235,"#FCE5D6"); step(s,"04","Continue","Use a dashboard, planner, streaks and profile preferences to stay consistent.",846,260,330,"#EEE9F2"); tx(s,"The product goal is not just AI answers. It is a repeatable study workflow.",60,492,1035,36,23,C.plum,true);note(s,"Define the four-part value of the project and connect it to the upcoming architecture.");}
//4
{const s=p.slides.add();base(s,4,"Aasveer Singh");title(s,"What students can do","One application, several focused study actions."); photo(s,"planner",810,108,390,390,"Study planner screen"); const items=[["Material library","Store uploaded PDFs and choose the active study source."],["Study chat","Ask a topic-specific question and receive a grounded response."],["Flashcards","Create short review prompts for recall practice."],["Quizzes","Attempt varied MCQs and receive immediate feedback."],["Planner","Organise tasks and deadlines around a study routine."]]; let y=238; for(const [a,b] of items){tx(s,a,62,y,220,25,18,C.ink,true);tx(s,b,300,y,420,30,15,C.muted,false);line(s,62,y+38,638,C.line,1);y+=57} note(s,"Give a short tour of the project capabilities. This is the bridge between problem and implementation.");}
//5
{const s=p.slides.add();base(s,5,"Akshita");title(s,"System architecture","A React frontend communicates with a FastAPI backend and local services."); const nodes=[["Student browser","React and Next.js interface",60,258,218,C.lilac],["FastAPI service","API routes and business logic",340,258,218,C.mint],["SQLite database","Accounts, preferences and tasks",620,258,218,"#FCE5D6"],["Study intelligence","PDF text, chunks and AI provider",900,258,250,"#EEE9F2"]]; for(const [a,b,x,y,w,fill] of nodes){s.shapes.add({geometry:"roundRect",position:{left:x,top:y,width:w,height:142},fill,line:{style:"solid",fill:C.line,width:1},borderRadius:"rounded-2xl"});tx(s,a,x+18,y+23,w-36,28,18,C.ink,true);tx(s,b,x+18,y+60,w-36,48,14,C.muted,false);} for(const x of [278,558,838]){s.shapes.add({geometry:"rightArrow",position:{left:x,top:307,width:40,height:34},fill:C.lavender,line:{fill:"none",width:0}})} tx(s,"The browser never directly handles database queries or provider calls. The backend manages these steps.",60,475,1060,35,20,C.plum,true);note(s,"Walk left to right. Explain that the backend acts as the controlled middle layer.");}
//6
{const s=p.slides.add();base(s,6,"Akshita");title(s,"Backend workflow","A request travels through clear API steps before the student sees a result."); const rows=[["Authentication","Create account, sign in and protect user-specific actions."],["Material processing","Read PDF text, split it into searchable chunks and save useful metadata."],["Study endpoints","Receive questions, flashcard requests and quiz requests from the frontend."],["Persistence","Store profiles, tasks, files and selected study context in SQLite."]];let y=240;for(const [a,b] of rows){tx(s,a,68,y,235,26,18,C.plum,true);tx(s,b,329,y,650,40,16,C.ink,false);line(s,68,y+49,912,C.line,1);y+=70}photo(s,"profile",1000,182,198,300,"Profile setup screen");note(s,"Use everyday language: API endpoints are backend doors that accept a request and return a response.");}
//7
{const s=p.slides.add();base(s,7,"Akshita");title(s,"Grounded AI flow","The selected PDF supplies context for answers and practice material.");step(s,"1","Upload PDF","PyMuPDF extracts text from the student’s document.",70,260,245,C.lilac);step(s,"2","Chunk content","The backend divides text into smaller searchable pieces.",360,260,245,C.mint);step(s,"3","Find context","TF-IDF retrieval selects relevant chunks for a question.",650,260,245,"#FCE5D6");step(s,"4","Generate response","Gemini is used when available, with local handling for reliability.",940,260,245,"#EEE9F2");tx(s,"Why this matters: the system can answer using material the student selected, instead of only a generic prompt.",70,505,1080,42,21,C.plum,true);note(s,"Explain retrieval augmented generation without jargon: first find the relevant notes, then formulate the response.");}
//8
{const s=p.slides.add();base(s,8,"Manik Jasrotia — frontend");title(s,"Frontend architecture","The frontend makes study tasks clear.","Frontend section presented by Manik Jasrotia."); photo(s,"dark",754,104,460,430,"Dark dashboard screen"); const items=[["App pages","Dashboard, library, chat, quizzes, planner and profile pages."],["Reusable components","Navigation, cards, controls and modal patterns are shared across screens."],["State and APIs","The frontend calls backend routes and refreshes visible study data."],["Responsive styling","Layouts adapt to common desktop and mobile widths."]]; let y=242;for(const [a,b] of items){tx(s,a,60,y,228,26,18,C.ink,true);tx(s,b,60,y+29,585,38,15,C.muted,false);y+=91}note(s,"Manik can explain frontend as the visible layer that turns backend data into usable interactions.");}
//9
{const s=p.slides.add();base(s,9,"Manik Jasrotia — frontend");title(s,"Designed for a human study routine","Warm surfaces, clear hierarchy and fewer distractions support regular use."); photo(s,"home",64,224,530,340,"StudyForge home"); photo(s,"chat",662,224,530,340,"StudyForge chat"); label(s,"DASHBOARD",100,584,132,C.lilac); label(s,"CONTEXTUAL STUDY CHAT",716,584,214,C.mint); tx(s,"The interface puts the next study action in view instead of making students search through technical menus.",64,180,1020,28,18,C.muted,false);note(s,"Point to the two real product screens. Describe hierarchy: orient first, then let the student act.");}
//10
{const s=p.slides.add();base(s,10,"Manik Jasrotia — frontend");title(s,"Profile, theme and avatar experience","Personalisation makes the product feel owned by the student."); photo(s,"avatar",800,94,384,434,"Avatar customisation screen"); bullet(s,"A profile setup flow stores preferences through the backend profile API.",60,242,625,C.lavender); bullet(s,"Gender-aware options and custom choices are presented in a 3D-styled visual avatar experience.",60,326,625,C.peach); bullet(s,"Theme controls support light and dark study environments while maintaining readable content.",60,410,625,C.mint); label(s,"FRONTEND-ONLY PRESENTATION SECTION",60,528,310,"#FCE5D6");note(s,"Clarify that this is 3D-styled visual treatment in the interface, built for a friendly, interactive feeling.");}
//11
{const s=p.slides.add();base(s,11,"Aasveer Singh");title(s,"Practice that stays useful","Flashcards and quizzes are designed to cover different ideas from the same material."); photo(s,"darkProfile",825,104,355,420,"StudyForge profile in dark theme"); step(s,"A","Broader coverage","Prompts ask for several different concepts.",60,300,222,C.lilac); step(s,"B","Duplicate filter","Similarity checks remove near-repeat questions.",304,300,222,C.mint); step(s,"C","Topic labels","Focus labels show what each item tests.",548,300,222,"#FCE5D6");tx(s,"If the external AI provider is temporarily busy, the backend creates a local source-grounded quiz from saved material chunks.",60,505,700,52,18,C.plum,true);note(s,"Emphasise reliability. The fallback lets students keep practising instead of only seeing an error.");}
//12
{const s=p.slides.add();base(s,12,"Aasveer Singh");title(s,"Validation and current status","The project was checked from backend behaviour through to the visible frontend build."); const check=[["Backend reliability tests","Targeted tests covered AI failure handling and workspace behaviour.",C.mint],["Local quiz fallback","Direct testing generated varied questions from stored study chunks.",C.lilac],["Frontend production build","The Next.js frontend completed a production build successfully.","#FCE5D6"],["Browser review","Pages and study actions were checked through the running local application.","#EEE9F2"]];let x=60;for(const [a,b,fill] of check){s.shapes.add({geometry:"roundRect",position:{left:x,top:245,width:260,height:250},fill,line:{style:"solid",fill:C.line,width:1},borderRadius:"rounded-2xl"});tx(s,"✓",x+20,266,32,28,23,C.plum,true);tx(s,a,x+20,312,220,51,18,C.ink,true);tx(s,b,x+20,377,220,76,15,C.muted,false);x+=282}note(s,"Describe validation honestly: automated backend checks, build verification and browser-visible testing.");}
//13
{const s=p.slides.add();base(s,13,"Aasveer Singh");title(s,"What comes next","The project has a solid student workflow and clear paths for future improvement."); const left=[["Smarter content review","Allow students to rate cards and quizzes to improve future generation."],["Analytics","Show weak topics, time spent and revision history."],["More formats","Support notes, images and additional subject-specific templates."]];let y=240;for(const [a,b] of left){tx(s,a,62,y,300,26,19,C.plum,true);tx(s,b,62,y+32,500,45,16,C.ink,false);line(s,62,y+86,520,C.line,1);y+=106}photo(s,"planner",650,205,520,350,"Study planner interface");note(s,"End the technical story by showing that the roadmap extends the current product rather than changing its core purpose.");}
//14
{const s=p.slides.add();s.background.fill=C.plum;s.shapes.add({geometry:"ellipse",position:{left:-164,top:388,width:480,height:480},fill:C.lavender,line:{fill:"none",width:0}});s.shapes.add({geometry:"ellipse",position:{left:1000,top:-220,width:520,height:520},fill:C.peach,line:{fill:"none",width:0}});tx(s,"Live demo flow",70,88,500,55,39,C.white,true);tx(s,"1. Sign in  →  2. Select study material  →  3. Ask a question  →  4. Generate a quiz",70,173,925,38,20,"#F4EDFF",false);line(s,70,236,918,"#CDB5F7",2);tx(s,"Thank you",70,307,460,64,50,C.white,true);tx(s,"Questions and discussion",70,382,500,40,24,"#F4EDFF",false);tx(s,"Akshita  ·  Aasveer Singh  ·  Manik Jasrotia",70,564,700,28,19,C.white,true);tx(s,"StudyForge AI — a calmer study workspace for B.Tech students",70,608,760,25,16,"#E8DDF4",false);note(s,"Invite the faculty to see the login, selected material, study chat and generated quiz. Share the presentation naturally between all members.");}

const candidatePath = path.join(buildDir,"StudyForge_Midterm_Project_Display_Final.draft.pptx");
await (await PresentationFile.exportPptx(p)).save(candidatePath);
const requirements = { explicitTotalSlideCount:14, requiredNativeTableOwnerSlides:[], requiredNativeChartOwnerSlides:[] };
const fontPolicy = { basis:"design", families:[family] };
const result = await finalizePresentation({ ...requirements, workspaceDir, candidatePath, finalPath:FINAL_PPTX, pythonExecutable:RUNTIME_PYTHON, integrityValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_package_integrity.py"), layoutValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_layout_geometry.py"), layoutArgs:["--expected-slide-size-emu","12192000,6858000","--validate-bullet-geometry","--validate-heading-fit"], fontPolicy, verifyArtifactToolImport:true, receiptPath:path.join(buildDir,"StudyForge_Midterm_Project_Display_Final.validation.json") });
console.log(JSON.stringify({family, final:FINAL_PPTX, result},null,2));
