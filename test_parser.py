import os
from parser import parse_resume

def create_sample_text_resume(filepath):
    """Creates a sample text resume for local unit tests."""
    sample_content = """
    Johnathan Doe
    Software Engineer
    Email: johnathan.doe@emailprovider.com | Phone: +1 123 456 7890
    Address: Seattle, WA
    
    Professional Summary:
    Talented developer with experience building Python APIs and React web applications.
    
    Education:
    Bachelor of Science in Computer Science
    University of Washington, Seattle | 2018 - 2022
    
    Skills:
    Python, JavaScript, TypeScript, React, Flask, PostgreSQL, Docker, AWS, Git, Communication
    
    Experience:
    Junior Engineer at TechCorp (2022 - Present)
    - Developed backend services using Flask and SQLite.
    - Containerized applications with Docker.
    """
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(sample_content.strip())

def run_tests():
    test_file = "sample_resume_test.txt"
    create_sample_text_resume(test_file)
    
    print("Starting parser extraction test...")
    print("-" * 40)
    
    try:
        results = parse_resume(test_file, test_file)
        
        print(f"File Parsed: {test_file}")
        print(f"Extracted Name:      {results['name']}")
        print(f"Extracted Email:     {results['email']}")
        print(f"Extracted Phone:     {results['phone']}")
        print(f"Extracted Skills:    {', '.join(results['skills'])}")
        print(f"Extracted Education:\n{results['education']}")
        
        # Simple assertions
        assert results['name'] == 'Johnathan Doe', f"Expected 'Johnathan Doe', got '{results['name']}'"
        assert results['email'] == 'johnathan.doe@emailprovider.com', f"Expected email match, got '{results['email']}'"
        assert results['phone'] == '+1 123 456 7890', f"Expected phone match, got '{results['phone']}'"
        assert 'Python' in results['skills'], "Expected 'Python' in skills"
        assert 'React' in results['skills'], "Expected 'React' in skills"
        assert 'University of Washington' in results['education'], "Expected University info in education"
        
        print("-" * 40)
        print("Success: All parser extraction validation tests passed successfully!")
        
    except AssertionError as ae:
        print(f"Assertion Error: {ae}")
    except Exception as e:
        print(f"Exception during testing: {e}")
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)

if __name__ == "__main__":
    run_tests()
