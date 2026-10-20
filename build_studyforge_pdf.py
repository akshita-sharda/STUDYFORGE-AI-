from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.colors import HexColor
from pathlib import Path

OUT = Path("output/pdf/StudyForge_AI_PPT_Content_and_Speech.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = HexColor("#14324A")
TEAL = HexColor("#0F8B8D")
LIGHT = HexColor("#EAF5F5")
GRAY = HexColor("#53636E")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Cover", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=29, leading=35, textColor=NAVY, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], fontSize=14, leading=20, textColor=TEAL, alignment=TA_CENTER, spaceAfter=20))
styles.add(ParagraphStyle(name="SlideTitle", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=20, leading=25, textColor=NAVY, spaceAfter=10))
styles.add(ParagraphStyle(name="Label", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEAL, spaceBefore=7, spaceAfter=5))
styles.add(ParagraphStyle(name="Body2", parent=styles["BodyText"], fontSize=10.5, leading=15, textColor=colors.HexColor("#26343D"), spaceAfter=6))
styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=9, leading=12, textColor=GRAY, spaceAfter=4))
styles.add(ParagraphStyle(name="Footer", parent=styles["Normal"], fontSize=8, textColor=GRAY, alignment=TA_CENTER))

def P(text, style="Body2"):
    return Paragraph(text, styles[style])

def bullets(items):
    return [P("- " + x, "Body2") for x in items]

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HexColor("#D6E4E8"))
    canvas.line(18*mm, 14*mm, 192*mm, 14*mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GRAY)
    canvas.drawString(18*mm, 9*mm, "StudyForge AI | PPT content and speaker script")
    canvas.drawRightString(192*mm, 9*mm, str(doc.page))
    canvas.restoreState()

slides = [
    ("Slide 1 - Title", "Akshita", [
        "<b>Put on the slide</b>",
        "StudyForge AI<br/><font color='#0F8B8D'>Your Personal AI-Powered Study Companion</font><br/><br/>Presented by: Akshita, Aasveer, and Manik<br/>Under the guidance of: [Faculty Name]<br/>[Department and College Name]",
        "<b>Speech</b><br/>Good morning/afternoon everyone. I am Akshita, and along with my teammates Aasveer and Manik, I am presenting our project, StudyForge AI. StudyForge AI is an AI-powered platform that helps students organise their study material, understand difficult topics, track revision, and manage academic tasks."
    ]),
    ("Slide 2 - Problem Statement", "Akshita", [
        "<b>Put on the slide</b>",
        "Students commonly face these problems:",
        "Notes and PDFs are scattered.<br/>Difficult topics take more time to understand.<br/>Revision is not properly tracked.<br/>Assignments and pending questions may be forgotten.<br/>General AI tools may not use the student's own study material.",
        "<b>Speech</b><br/>Students use many different resources such as PDFs, notes, websites, and applications. Because these resources are scattered, students may find it difficult to organise their learning and understand difficult topics. They may also forget assignments, fail to revise regularly, or receive answers that are not connected to their own study material. This is the problem that StudyForge AI aims to solve."
    ]),
    ("Slide 3 - Proposed Solution", "Akshita", [
        "<b>Put on the slide</b>",
        "StudyForge AI provides one platform for organising subjects and PDF notes, asking questions about study material, receiving AI-based explanations, tracking revision, managing academic tasks, and saving previous conversations.",
        "<b>Speech</b><br/>Our solution is StudyForge AI, a single platform that combines study material, AI assistance, revision tracking, planning, and saved conversations. Students can upload their notes, ask questions related to those notes, choose the type of help they need, and manage their academic activities in one place."
    ]),
    ("Slide 4 - Objectives", "Akshita", [
        "<b>Put on the slide</b>",
        "- Organise academic material.<br/>- Provide document-based AI assistance.<br/>- Offer multiple study modes.<br/>- Support revision and self-assessment.<br/>- Help students manage academic tasks.<br/>- Save conversations for future learning.",
        "<b>Speech</b><br/>The main objective of our project is to make studying more organised and personalised. We want to help students learn from their own documents, receive suitable AI assistance, track their revision, manage academic tasks, and continue previous conversations whenever required. Now, Aasveer will explain the main features of the project."
    ]),
    ("Slide 5 - Main Features", "Aasveer", [
        "<b>Put on the slide</b>",
        "<b>Subject Library:</b> create subjects, upload PDF notes, assign documents, search, filter, and download.<br/><br/><b>AI Study Assistant:</b> ask questions about selected PDFs, receive relevant answers, and save conversations.<br/><br/><b>Study Modes:</b> Explain Simply, Give a Hint, Debug My Code, Practise Viva, Solve Step by Step, and Plan My Study.",
        "<b>Speech</b><br/>The first feature is the Subject Library. Students can create subjects, upload PDF notes, organise documents, search for them, and download them when required. The second feature is the AI Study Assistant. Students can select a document and ask questions about its content. StudyForge AI also provides different study modes. Each mode gives a different kind of support according to the student's requirement."
    ]),
    ("Slide 6 - Revision Tracker and Planner", "Aasveer", [
        "<b>Put on the slide</b>",
        "<b>Revision Tracker:</b> Learning, Needs Revision, Confident.<br/><br/><b>My Planner:</b> assignments, examinations, revision tasks, pending questions, and optional due dates.",
        "<b>Speech</b><br/>StudyForge AI includes a Revision Tracker. Students can add topics and mark them as Learning, Needs Revision, or Confident. These statuses are based on the student's own self-assessment. The platform also includes My Planner, where students can add assignments, examinations, revision tasks, and pending questions. Tasks can be edited, completed, reopened, or deleted."
    ]),
    ("Slide 7 - How the System Works", "Aasveer", [
        "<b>Put on the slide</b>",
        "Student selects subject -> uploads or selects a PDF -> chooses a study mode -> asks a question -> system processes document and question -> AI response is displayed -> conversation can be saved.",
        "<b>Speech</b><br/>First, the student selects or creates a subject. Then, the student uploads or selects a PDF document. After that, the student chooses a study mode and asks a question. The system processes the selected document, the question, the study mode, and the recent conversation. Finally, the AI response is displayed, and the student can continue or save the conversation."
    ]),
    ("Slide 8 - Frontend and Demonstration", "Manik", [
        "<b>Put on the slide</b>",
        "Frontend screens: Dashboard, Subject Library, PDF selection, AI Chat, Revision Tracker, My Planner, and Saved Conversations.",
        "<b>Speech</b><br/>I worked on the frontend part of StudyForge AI. The frontend is the part of the application that students directly see and use. It includes the dashboard, Subject Library, PDF selection, AI chat interface, Revision Tracker, My Planner, and saved conversations. The main goal was to make the interface simple, clear, and easy to navigate.<br/><br/>For the demonstration, I will open the dashboard, select a subject and document, choose Explain Simply, enter a question, and show the AI response. I will also show the Revision Tracker and My Planner."
    ]),
    ("Slide 9 - Technology Stack", "Aasveer", [
        "<b>Put on the slide</b>",
        "Frontend - React and Vite<br/>Backend - FastAPI and Python<br/>Database - SQLite<br/>PDF Processing - PyMuPDF<br/>AI Service - Gemini<br/>Testing - Pytest and browser workflow testing",
        "<b>Speech</b><br/>The frontend was developed using React and Vite. The backend was developed using FastAPI and Python. SQLite is used to store subjects, documents, revision topics, planner tasks, and saved conversations. PyMuPDF is used for PDF processing. Gemini is used for AI-generated responses when available. We used Pytest and browser-based testing for validation."
    ]),
    ("Slide 10 - System Architecture", "Aasveer", [
        "<b>Put on the slide</b>",
        "Frontend: React and Vite user interface<br/>Backend: FastAPI and Python services<br/>Database: SQLite application data<br/>Document and AI layer: PyMuPDF and Gemini",
        "<b>Speech</b><br/>The system contains four main layers. The frontend allows the student to interact with the application. The backend receives requests and manages application functions. The database stores subjects, documents, revision records, planner tasks, and saved conversations. The document and AI layer processes PDF content and generates AI responses. These layers work together to provide the complete StudyForge experience."
    ]),
    ("Slide 11 - Testing and Team Contributions", "Akshita", [
        "<b>Put on the slide</b>",
        "<b>Testing:</b> backend API testing, frontend build testing, browser workflow testing, document management, revision tracking, saved conversations, code-copy functionality, and mobile layout.<br/><br/><b>Team contributions:</b><br/>Akshita - [insert actual contribution]<br/>Aasveer - [insert actual contribution]<br/>Manik - frontend development and user-interface demonstration.",
        "<b>Speech</b><br/>We tested the important functions of our project. Our testing included backend API testing, frontend build testing, browser workflow testing, subject and document management, revision tracking, saved conversations, code-copy functionality, and mobile layout behaviour. I am Akshita, and my contribution was [state your actual contribution]. Aasveer's contribution was [state Aasveer's actual contribution]. Manik worked on the frontend development and user-interface demonstration."
    ]),
    ("Slide 12 - Limitations and Future Scope", "Aasveer", [
        "<b>Put on the slide</b>",
        "<b>Limitations:</b> AI depends on Gemini availability and quota; poor-quality scans may require clarification; large PDFs may need to be divided; planner dates do not currently send notifications; revision status is based on self-assessment.<br/><br/><b>Future scope:</b> automatic reminders, multilingual support, personalised recommendations, performance analytics, cloud storage, group study, voice interaction, and better handwritten-note support.",
        "<b>Speech</b><br/>Our project has some limitations. AI responses depend on the availability and quota of the Gemini service. Poor-quality scans may require clarification, and large documents may need to be divided. Planner dates currently do not send automatic notifications. Revision status is based on the student's own self-assessment. In the future, we can add reminders, multilingual support, personalised recommendations, analytics, cloud storage, group study, voice interaction, and better support for handwritten notes."
    ]),
    ("Slide 13 - Conclusion", "Akshita", [
        "<b>Put on the slide</b>",
        "StudyForge AI helps students organise study materials, understand difficult topics, ask document-based questions, track revision, manage academic tasks, and continue previous conversations.<br/><br/><b>StudyForge AI turns scattered study material into a structured learning experience.</b>",
        "<b>Speech</b><br/>To conclude, StudyForge AI is a student-focused platform that combines document-based learning, AI assistance, revision tracking, academic planning, and saved conversations. It helps students transform scattered study material into a structured learning experience. Our project demonstrates how Artificial Intelligence can support students in understanding concepts, revising effectively, managing academic responsibilities, and preparing for examinations. Thank you for listening to our presentation. We are ready to answer your questions."
    ]),
]

story = []
story.append(Spacer(1, 35*mm))
story.append(P("StudyForge AI", "Cover"))
story.append(P("PPT Content and Word-for-Word Speaker Script", "Subtitle"))
story.append(Spacer(1, 18*mm))
story.append(P("Presented by Akshita, Aasveer, and Manik", "Body2"))
story.append(P("Replace the bracketed fields with your guide, department, college, and actual team contributions before presenting.", "Small"))
story.append(PageBreak())

for title, speaker, parts in slides:
    story.append(P(title, "SlideTitle"))
    story.append(P("Speaker: " + speaker, "Label"))
    for i, part in enumerate(parts):
        story.append(P(part, "Body2" if i else "Label"))
        story.append(Spacer(1, 3))
    story.append(Spacer(1, 8))
    if title != slides[-1][0]:
        story.append(PageBreak())

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=20*mm, title="StudyForge AI PPT Content and Speech")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
