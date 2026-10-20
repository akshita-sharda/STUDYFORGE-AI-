from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas


OUTPUT = Path("output/pdf/StudyForge_AI_Seven_Progress_Reports.pdf")

REPORTS = [
    ("Progress Report 1", [
        "Project idea finalized.",
        "StudyForge AI structure created.",
        "Backend folder prepared.",
        "Frontend folder prepared.",
        "ASHIEY chatbot planned.",
        "Study features decided.",
    ]),
    ("Progress Report 2", [
        "The backend of StudyForge AI was developed using FastAPI to manage the main functions of the project.",
        "A PDF upload feature was added so students can upload their study material directly to the website.",
        "ASHIEY was developed to answer student questions by finding relevant information from the uploaded PDF.",
        "Flashcard and quiz features were added to help students revise topics in a more interactive way.",
        "A Concept Match game and progress-tracking features were included to make studying more engaging for students.",
        "The backend was tested successfully through the health check, PDF upload, and chatbot question-answering process.",
    ]),
    ("Progress Report 3", [
        "The frontend dashboard of StudyForge AI was improved to provide students with a simple and easy-to-use study interface.",
        "The backend and frontend were connected so that the website can use the chatbot and study tools properly.",
        "Features such as profile editing, theme switching, and website-import support were added to improve the student experience.",
        "The project files were connected to GitHub so that all code changes can be saved online safely.",
        "The updated backend and frontend code was checked before uploading to make sure there were no formatting or security issues.",
        "The latest project code was successfully committed and pushed to the GitHub repository.",
    ]),
    ("Progress Report 4", [
        "The StudyForge AI website was redesigned with a modern and student-friendly interface to make the platform more attractive and easier to use.",
        "The dashboard layout, study cards, navigation bar, and mobile view were improved so students can access features comfortably on different devices.",
        "A warm creative design theme with clear typography, soft colours, and smooth animations was added to give the website a professional look.",
        "The existing study features and chatbot functions were preserved during the redesign so that the improved design did not affect the working features.",
        "The frontend website was tested successfully, and the build process was completed without errors.",
        "A presentation for StudyForge AI was also prepared to explain the project idea, features, working process, and future scope.",
    ]),
    ("Progress Report 5", [
        "The main features of StudyForge AI have been completed, including the AI chatbot, PDF study support, quizzes, flashcards, games, and progress tracking.",
        "ASHIEY is ready to assist BTech students by answering their study-related questions in a friendly and simple way.",
        "Students can upload their PDF study material and receive answers based on the information available in their uploaded documents.",
        "The quiz and flashcard tools are available to help students revise important topics and check their understanding.",
        "The website design, backend functions, and frontend interface have been checked through testing to make sure the project works properly.",
        "The project source code is saved in the repository, while some project documents, PDFs, and generated output folders still need to be uploaded.",
    ]),
    ("Progress Report 6", [
        "The final StudyForge AI project was organized in the main project folder so that the latest version can be opened and run correctly.",
        "The startup process was improved to handle old or broken Python environments and allow the backend and frontend to run properly.",
        "The StudyForge AI website and backend were checked successfully, and both were available for use during the project demonstration.",
        "A complete presentation was prepared to explain the problem, solution, features, technology stack, workflow, testing, limitations, and future scope of the project.",
        "Speaker notes were created for the complete presentation so that the project can be explained clearly during the final presentation.",
        "A PDF version of the speaker notes and presentation content was generated to support project revision and final demonstration preparation.",
    ]),
    ("Progress Report 7 - Final", [
        "The final project presentation was reviewed and improved to make the explanation of StudyForge AI clear and suitable for the project demonstration.",
        "The presentation deck, speaker notes, and PDF materials were prepared so that the team can revise the project before presenting it.",
        "The technology stack and working process of StudyForge AI were explained clearly for use during the presentation and viva.",
        "The project demonstration flow was planned to show the dashboard, PDF upload, AI chatbot, quiz, flashcards, revision tracker, and planner features.",
        "The frontend build and browser testing were already completed, which confirmed that the main website interface was ready for demonstration.",
        "The remaining work includes replacing presentation placeholders, uploading pending documents and output files, and confirming access to the Canva presentation.",
    ]),
]


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    page_width, page_height = A4
    left, right = 0.82 * inch, 0.82 * inch
    content_width = page_width - left - right
    for index, (heading, bullets) in enumerate(REPORTS, start=1):
        pdf.setFillColor(colors.HexColor("#6B6177"))
        pdf.setFont("Helvetica", 11)
        pdf.drawCentredString(page_width / 2, page_height - 1.05 * inch, "StudyForge AI")
        pdf.setFillColor(colors.HexColor("#3D2C5A"))
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawCentredString(page_width / 2, page_height - 1.7 * inch, heading)

        y = page_height - 2.45 * inch
        pdf.setFillColor(colors.HexColor("#24212A"))
        pdf.setFont("Helvetica", 12)
        for item in bullets:
            lines = simpleSplit(item, "Helvetica", 12, content_width - 22)
            pdf.drawString(left, y, "-")
            for line_number, line in enumerate(lines):
                pdf.drawString(left + 16, y, line)
                y -= 19
            y -= 15

        pdf.setStrokeColor(colors.HexColor("#D9D1E8"))
        pdf.setLineWidth(0.8)
        pdf.line(0.72 * inch, 0.62 * inch, page_width - 0.72 * inch, 0.62 * inch)
        pdf.setFont("Helvetica", 9)
        pdf.setFillColor(colors.HexColor("#66557F"))
        pdf.drawString(0.72 * inch, 0.42 * inch, "StudyForge AI - Progress Reports")
        pdf.drawRightString(page_width - 0.72 * inch, 0.42 * inch, f"Page {index}")
        pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    build_pdf()
