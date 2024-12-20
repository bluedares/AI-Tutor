import os
from dotenv import load_dotenv
from openai import OpenAI

def test_openai_connection():
    # Load environment variables
    load_dotenv()
    
    # Get API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY not found in environment variables")
        return False
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)
        
        # Test API with a simple completion
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Hello, this is a test message. Please respond with 'API is working correctly'."}
            ]
        )
        
        # Print response
        print("API Response:", response.choices[0].message.content)
        print("API test successful!")
        return True
        
    except Exception as e:
        print(f"Error testing OpenAI API: {str(e)}")
        return False

if __name__ == "__main__":
    test_openai_connection()
