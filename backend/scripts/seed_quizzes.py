"""
Seed and verify quiz content for all Kitsuno courses.
Idempotent script: creates and updates quizzes, questions, and options without duplicating records.
All 9 courses receive rich, curriculum-aligned assessments at key milestone lessons.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import Course, Module, Lesson, Quiz, Question, Option

# =============================================================================
# QUIZ DEFINITIONS
# Format: (course_title, module_order, lesson_order): {
#     "title": "...",
#     "description": "...",
#     "questions": [
#         {
#             "text": "...",
#             "points": 1,
#             "options": [
#                 ("...", False),
#                 ("...", True),
#                 ("...", False),
#                 ("...", False),
#             ]
#         }
#     ]
# }
# =============================================================================

QUIZ_DATA = {
    # -------------------------------------------------------------------------
    # 1. Introduction to HTML (3 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to HTML", 1, 1): {
        "title": "HTML Document Structure & Core Elements",
        "description": "Assess your understanding of HTML5 document structure, headings, paragraphs, and foundational tags.",
        "questions": [
            {
                "text": "What is the primary purpose of the <!DOCTYPE html> declaration at the beginning of an HTML file?",
                "points": 1,
                "options": [
                    ("It informs the browser that the document is written in modern HTML5.", True),
                    ("It links the HTML document to external CSS stylesheets.", False),
                    ("It configures character encoding to UTF-8 automatically.", False),
                    ("It acts as the root container element for all visible text.", False),
                ],
            },
            {
                "text": "Which HTML element is the semantically correct choice for the primary, top-level heading of a page?",
                "points": 1,
                "options": [
                    ("<heading>", False),
                    ("<head>", False),
                    ("<h1>", True),
                    ("<h6>", False),
                ],
            },
            {
                "text": "What is the key functional difference between content in the <head> element and content in the <body> element?",
                "points": 1,
                "options": [
                    ("The <head> contains page metadata and settings, while <body> contains visible rendered content.", True),
                    ("The <head> is rendered on mobile screens, while <body> is rendered on desktop screens.", False),
                    ("The <head> can only contain CSS styles, while <body> can only contain images.", False),
                    ("There is no functional difference between the two tags.", False),
                ],
            },
            {
                "text": "Which tag creates a standard paragraph of body text in HTML?",
                "points": 1,
                "options": [
                    ("<text>", False),
                    ("<p>", True),
                    ("<para>", False),
                    ("<span>", False),
                ],
            },
            {
                "text": "Which of the following is a self-closing (void) element that inserts a single line break?",
                "points": 1,
                "options": [
                    ("<break>", False),
                    ("<lb>", False),
                    ("<br>", True),
                    ("<newline>", False),
                ],
            },
        ],
    },
    ("Introduction to HTML", 1, 4): {
        "title": "HTML Hyperlinks, Media & Attributes",
        "description": "Test your knowledge of anchor tags, images, attributes, and button elements.",
        "questions": [
            {
                "text": "Which attribute on the <a> tag specifies the destination web address of a hyperlink?",
                "points": 1,
                "options": [
                    ("src", False),
                    ("href", True),
                    ("link", False),
                    ("url", False),
                ],
            },
            {
                "text": "Why is the alt attribute essential when using the <img> tag in HTML?",
                "points": 1,
                "options": [
                    ("It provides descriptive text for screen readers and displays when the image fails to load.", True),
                    ("It controls the border thickness of the image.", False),
                    ("It specifies an alternate high-resolution version of the image.", False),
                    ("It defines the mouse-hover tooltip animation.", False),
                ],
            },
            {
                "text": "Which value of the target attribute instructs the browser to open a hyperlink in a new tab or window?",
                "points": 1,
                "options": [
                    ("_new", False),
                    ("_tab", False),
                    ("_blank", True),
                    ("_window", False),
                ],
            },
            {
                "text": "What does an anchor link with href='#section-2' do when clicked?",
                "points": 1,
                "options": [
                    ("It scrolls the viewport directly to the element with id='section-2' on the same page.", True),
                    ("It attempts to download an external file named section-2.", False),
                    ("It reloads the page with query parameter section-2.", False),
                    ("It triggers an error because hash symbols are invalid in href.", False),
                ],
            },
            {
                "text": "Which HTML element should be used for clickable interface buttons that trigger JavaScript actions or submit forms?",
                "points": 1,
                "options": [
                    ("<button>", True),
                    ("<click>", False),
                    ("<input-action>", False),
                    ("<btn>", False),
                ],
            },
        ],
    },
    ("Introduction to HTML", 1, 14): {
        "title": "HTML Forms, Inputs & Semantic Layout",
        "description": "Evaluate your proficiency with HTML forms, input types, labels, and semantic document structure.",
        "questions": [
            {
                "text": "Which input type masks user keystrokes for secure credential entry?",
                "points": 1,
                "options": [
                    ("<input type='secret'>", False),
                    ("<input type='hidden'>", False),
                    ("<input type='password'>", True),
                    ("<input type='secure'>", False),
                ],
            },
            {
                "text": "Why should a <label> element be connected to an <input> using the for attribute matching the input's id?",
                "points": 1,
                "options": [
                    ("It enhances accessibility for assistive technologies and allows clicking the label to focus the input.", True),
                    ("It enforces client-side password encryption before form submission.", False),
                    ("It automatically styles the label with bold font weight.", False),
                    ("It prevents the form from submitting empty values.", False),
                ],
            },
            {
                "text": "Which HTTP method should be specified on a <form> when sending sensitive data to the backend server?",
                "points": 1,
                "options": [
                    ("GET", False),
                    ("POST", True),
                    ("FETCH", False),
                    ("QUERY", False),
                ],
            },
            {
                "text": "Which HTML5 semantic element is specifically intended to contain the primary website navigation links?",
                "points": 1,
                "options": [
                    ("<navigate>", False),
                    ("<menu-bar>", False),
                    ("<nav>", True),
                    ("<links>", False),
                ],
            },
            {
                "text": "What is the function of the required attribute when placed on an HTML <input> field?",
                "points": 1,
                "options": [
                    ("The browser prevents form submission until a value is entered into the field.", True),
                    ("The field cannot be edited once filled out.", False),
                    ("The input value is converted to uppercase automatically.", False),
                    ("The input requires exactly 10 characters.", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 2. Introduction to CSS (3 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to CSS", 1, 4): {
        "title": "CSS Selectors, Colors & The Box Model",
        "description": "Test your mastery of CSS selectors, specificity, color styling, and the Box Model.",
        "questions": [
            {
                "text": "In the CSS Box Model, what is the correct ordering of layers from the innermost content to the outside?",
                "points": 1,
                "options": [
                    ("Content, Padding, Border, Margin", True),
                    ("Content, Margin, Border, Padding", False),
                    ("Content, Border, Padding, Margin", False),
                    ("Margin, Border, Padding, Content", False),
                ],
            },
            {
                "text": "Which CSS selector targets all HTML elements that have class='btn-primary'?",
                "points": 1,
                "options": [
                    ("#btn-primary", False),
                    (".btn-primary", True),
                    ("btn-primary", False),
                    ("*btn-primary", False),
                ],
            },
            {
                "text": "What does setting box-sizing: border-box; do to an element?",
                "points": 1,
                "options": [
                    ("It includes padding and border within the element's specified width and height.", True),
                    ("It removes all margins from around the element.", False),
                    ("It forces the border to match the background color.", False),
                    ("It converts the element to an inline display element.", False),
                ],
            },
            {
                "text": "Which of the following CSS selectors carries the highest specificity ranking?",
                "points": 1,
                "options": [
                    (".nav-item (class)", False),
                    ("#nav-bar (ID)", True),
                    ("nav (type/element)", False),
                    ("* (universal)", False),
                ],
            },
            {
                "text": "If an element has 'margin: 15px 30px;', how are the margins applied?",
                "points": 1,
                "options": [
                    ("15px top and bottom, 30px left and right.", True),
                    ("15px left and right, 30px top and bottom.", False),
                    ("15px top, 30px right, 15px bottom, 0px left.", False),
                    ("45px on all four sides equally.", False),
                ],
            },
        ],
    },
    ("Introduction to CSS", 1, 8): {
        "title": "CSS Layouts, Display & Positioning",
        "description": "Assess your understanding of block vs inline display, z-index, and CSS positioning modes.",
        "questions": [
            {
                "text": "When an element has position: absolute;, its placement coordinates (top, left, etc.) are calculated relative to:",
                "points": 1,
                "options": [
                    ("Its nearest positioned ancestor (an ancestor with position other than static).", True),
                    ("Always the root <html> viewport element.", False),
                    ("Its immediate sibling element.", False),
                    ("The center of the computer monitor.", False),
                ],
            },
            {
                "text": "What is the default display mode of a standard <div> element in HTML?",
                "points": 1,
                "options": [
                    ("inline", False),
                    ("block", True),
                    ("inline-block", False),
                    ("flex", False),
                ],
            },
            {
                "text": "Which CSS property specifies the stack order of overlapping elements along the z-axis?",
                "points": 1,
                "options": [
                    ("layer-index", False),
                    ("elevation", False),
                    ("z-index", True),
                    ("stack-order", False),
                ],
            },
            {
                "text": "What happens when an element with fixed dimensions has overflow: hidden;?",
                "points": 1,
                "options": [
                    ("Any content that overflows the element's box is clipped and becomes invisible.", True),
                    ("Scrollbars automatically appear to allow scrolling through overflowing text.", False),
                    ("The element dynamically expands its dimensions to fit all text.", False),
                    ("Overflowing text is deleted from the DOM.", False),
                ],
            },
            {
                "text": "Which position value keeps an element fixed at a specific spot on the viewport even when the page is scrolled?",
                "points": 1,
                "options": [
                    ("position: relative;", False),
                    ("position: static;", False),
                    ("position: fixed;", True),
                    ("position: sticky;", False),
                ],
            },
        ],
    },
    ("Introduction to CSS", 1, 13): {
        "title": "CSS Flexbox, Transforms & Animations",
        "description": "Test your skills in modern Flexbox alignment, CSS transforms, and keyframe animations.",
        "questions": [
            {
                "text": "In a flex container with flex-direction: row;, which property aligns items along the horizontal main axis?",
                "points": 1,
                "options": [
                    ("align-items", False),
                    ("justify-content", True),
                    ("flex-flow", False),
                    ("align-content", False),
                ],
            },
            {
                "text": "Which CSS rule is used to define keyframe steps for a custom CSS animation?",
                "points": 1,
                "options": [
                    ("@animation name { ... }", False),
                    ("@keyframes name { ... }", True),
                    ("@animate name { ... }", False),
                    ("@transitions name { ... }", False),
                ],
            },
            {
                "text": "Which CSS property smoothly interpolates changes in property values (like hover background-color) over time?",
                "points": 1,
                "options": [
                    ("transition", True),
                    ("transform", False),
                    ("animation-delay", False),
                    ("interpolate", False),
                ],
            },
            {
                "text": "Which justify-content value distributes items evenly such that the first item touches the start edge and the last touches the end edge?",
                "points": 1,
                "options": [
                    ("space-around", False),
                    ("space-between", True),
                    ("space-evenly", False),
                    ("stretch", False),
                ],
            },
            {
                "text": "To perfectly center a single child element both horizontally and vertically inside a flex container, you use:",
                "points": 1,
                "options": [
                    ("justify-content: center; align-items: center;", True),
                    ("text-align: center; vertical-align: middle;", False),
                    ("margin: auto auto; float: center;", False),
                    ("align-content: middle; justify-items: center;", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 3. Introduction to JavaScript (5 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to JavaScript", 1, 10): {
        "title": "JavaScript Fundamentals, Variables & Math",
        "description": "Verify your understanding of let vs const, data types, arithmetic operators, and the Math object.",
        "questions": [
            {
                "text": "What is the difference between const and let when declaring variables in modern JavaScript?",
                "points": 1,
                "options": [
                    ("Variables declared with const cannot be reassigned, whereas let allows reassignment.", True),
                    ("const is function-scoped while let is block-scoped.", False),
                    ("const only holds numeric values, while let holds strings.", False),
                    ("let is deprecated in ES6 in favor of var.", False),
                ],
            },
            {
                "text": "What does the expression typeof 'Hello' evaluate to in JavaScript?",
                "points": 1,
                "options": [
                    ("'text'", False),
                    ("'string'", True),
                    ("'char'", False),
                    ("'String'", False),
                ],
            },
            {
                "text": "What is the output of console.log(10 + '5') in JavaScript?",
                "points": 1,
                "options": [
                    ("15", False),
                    ("'105'", True),
                    ("NaN", False),
                    ("TypeError", False),
                ],
            },
            {
                "text": "Which Math method rounds a floating-point number up to the nearest integer?",
                "points": 1,
                "options": [
                    ("Math.floor()", False),
                    ("Math.ceil()", True),
                    ("Math.round()", False),
                    ("Math.trunc()", False),
                ],
            },
            {
                "text": "What does the strict equality operator (===) compare in JavaScript?",
                "points": 1,
                "options": [
                    ("Both value and data type without performing implicit type coercion.", True),
                    ("Value only, converting types automatically if needed.", False),
                    ("Memory pointer references only.", False),
                    ("Whether a variable exists and is not undefined.", False),
                ],
            },
        ],
    },
    ("Introduction to JavaScript", 1, 25): {
        "title": "JavaScript Control Flow & Functions",
        "description": "Assess your understanding of conditionals, switch statements, and reusable functions in JavaScript.",
        "questions": [
            {
                "text": "What is the result of the ternary expression: 8 > 5 ? 'High' : 'Low'?",
                "points": 1,
                "options": [
                    ("'High'", True),
                    ("'Low'", False),
                    ("true", False),
                    ("undefined", False),
                ],
            },
            {
                "text": "What keyword is required inside each case block of a switch statement to prevent fall-through into subsequent cases?",
                "points": 1,
                "options": [
                    ("stop", False),
                    ("exit", False),
                    ("break", True),
                    ("return", False),
                ],
            },
            {
                "text": "What does a JavaScript function return by default if it does not contain an explicit return statement?",
                "points": 1,
                "options": [
                    ("null", False),
                    ("0", False),
                    ("undefined", True),
                    ("false", False),
                ],
            },
            {
                "text": "Which of the following is a valid ES6 arrow function that returns the double of x?",
                "points": 1,
                "options": [
                    ("const double = x => x * 2;", True),
                    ("function double => x * 2;", False),
                    ("const double = (x) -> x * 2;", False),
                    ("def double(x): return x * 2;", False),
                ],
            },
            {
                "text": "What is the scope of a variable declared with let inside an if block?",
                "points": 1,
                "options": [
                    ("Block scope (only accessible within that if block)", True),
                    ("Function scope (accessible anywhere in the parent function)", False),
                    ("Global scope (accessible anywhere across the entire script)", False),
                    ("Window object scope", False),
                ],
            },
        ],
    },
    ("Introduction to JavaScript", 1, 40): {
        "title": "JavaScript Arrays, Objects & Iteration",
        "description": "Test your knowledge of array methods, object property access, and functional transformations.",
        "questions": [
            {
                "text": "Which array method appends one or more elements to the end of an array?",
                "points": 1,
                "options": [
                    ("push()", True),
                    ("pop()", False),
                    ("shift()", False),
                    ("unshift()", False),
                ],
            },
            {
                "text": "Which array method creates a brand new array populated with the results of calling a function on each element?",
                "points": 1,
                "options": [
                    ("forEach()", False),
                    ("map()", True),
                    ("filter()", False),
                    ("reduce()", False),
                ],
            },
            {
                "text": "Given const student = { name: 'Kitsuno', xp: 500 };, how can you access the xp property?",
                "points": 1,
                "options": [
                    ("student.xp or student['xp']", True),
                    ("student->xp", False),
                    ("student(xp)", False),
                    ("student.get('xp')", False),
                ],
            },
            {
                "text": "What does the filter() method return when applied to an array?",
                "points": 1,
                "options": [
                    ("A new array containing only elements that pass the truth test implemented by the callback.", True),
                    ("The first element that matches the condition.", False),
                    ("A boolean indicating whether any element matched.", False),
                    ("The numeric index of the first match.", False),
                ],
            },
            {
                "text": "What is the output of [1, 2, 3, 4].reduce((acc, curr) => acc + curr, 0)?",
                "points": 1,
                "options": [
                    ("10", True),
                    ("4", False),
                    ("[1, 2, 3, 4]", False),
                    ("undefined", False),
                ],
            },
        ],
    },
    ("Introduction to JavaScript", 1, 60): {
        "title": "DOM Manipulation & Event Listeners",
        "description": "Test your ability to query HTML elements, modify classes, and handle user events.",
        "questions": [
            {
                "text": "Which modern DOM method finds and returns the first element matching a specified CSS selector string?",
                "points": 1,
                "options": [
                    ("document.querySelector()", True),
                    ("document.getElement()", False),
                    ("document.findSelector()", False),
                    ("document.select()", False),
                ],
            },
            {
                "text": "What is the recommended method to attach a click event listener to a button element stored in variable btn?",
                "points": 1,
                "options": [
                    ("btn.addEventListener('click', handleClick);", True),
                    ("btn.attachEvent('click', handleClick);", False),
                    ("btn.onClick = 'handleClick';", False),
                    ("btn.listen('click', handleClick);", False),
                ],
            },
            {
                "text": "How do you add a CSS class 'active' to an element's classList in JavaScript?",
                "points": 1,
                "options": [
                    ("element.classList.add('active');", True),
                    ("element.classes.push('active');", False),
                    ("element.addClass('active');", False),
                    ("element.classList += 'active';", False),
                ],
            },
            {
                "text": "What does event.preventDefault() do when called inside a form's 'submit' event handler?",
                "points": 1,
                "options": [
                    ("It stops the browser from performing its default action of refreshing or navigating away upon submit.", True),
                    ("It clears all input field values.", False),
                    ("It stops event bubbling to parent elements.", False),
                    ("It closes the browser window.", False),
                ],
            },
            {
                "text": "What is the security risk associated with setting element.innerHTML with untrusted user input?",
                "points": 1,
                "options": [
                    ("It exposes the application to Cross-Site Scripting (XSS) attacks by executing injected scripts.", True),
                    ("It causes the browser CSS engine to crash.", False),
                    ("It permanently deletes the element from the DOM.", False),
                    ("It disables the browser back button.", False),
                ],
            },
        ],
    },
    ("Introduction to JavaScript", 1, 80): {
        "title": "Asynchronous JavaScript, Promises & Fetch API",
        "description": "Evaluate your proficiency with callbacks, Promises, async/await, and REST API communication.",
        "questions": [
            {
                "text": "What does the browser's built-in fetch() API return?",
                "points": 1,
                "options": [
                    ("A Promise that resolves to a Response object.", True),
                    ("A direct parsed JavaScript object.", False),
                    ("A synchronous XML document.", False),
                    ("A raw byte buffer.", False),
                ],
            },
            {
                "text": "What keyword must precede a function declaration in order to use the await keyword inside it?",
                "points": 1,
                "options": [
                    ("async", True),
                    ("awaitable", False),
                    ("defer", False),
                    ("promise", False),
                ],
            },
            {
                "text": "How do you asynchronously parse the JSON payload from a fetch Response object res?",
                "points": 1,
                "options": [
                    ("await res.json()", True),
                    ("res.toJSON()", False),
                    ("JSON.parseAll(res)", False),
                    ("res.data()", False),
                ],
            },
            {
                "text": "Which statement block is used to gracefully handle errors thrown inside async/await functions?",
                "points": 1,
                "options": [
                    ("try { ... } catch (error) { ... }", True),
                    ("onError { ... }", False),
                    ("rescue { ... }", False),
                    ("catchError { ... }", False),
                ],
            },
            {
                "text": "What are the three possible lifecycle states of a JavaScript Promise?",
                "points": 1,
                "options": [
                    ("Pending, Fulfilled, Rejected", True),
                    ("Started, Running, Completed", False),
                    ("Waiting, Resolved, Failed", False),
                    ("Active, Inactive, Broken", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 4. Introduction to React (3 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to React", 1, 6): {
        "title": "React Components, JSX & Props Assessment",
        "description": "Test your mastery of functional components, JSX syntax, props, conditional rendering, and list rendering.",
        "questions": [
            {
                "text": "Why must JSX elements be wrapped in a single root element or Fragment (<>...</>)?",
                "points": 1,
                "options": [
                    ("Because JSX compiles to React.createElement() function calls, which must return a single JavaScript value.", True),
                    ("Because the browser DOM can only contain one HTML tag per page.", False),
                    ("Because CSS stylesheets cannot style multiple elements.", False),
                    ("Because React components are restricted to 5 lines of code.", False),
                ],
            },
            {
                "text": "How are custom data values passed from a parent React component to a child component?",
                "points": 1,
                "options": [
                    ("Via props passed as attributes on the component's JSX element.", True),
                    ("Via window global variables.", False),
                    ("Via CSS custom properties.", False),
                    ("Via URL hash fragments only.", False),
                ],
            },
            {
                "text": "Why is a unique 'key' prop required when rendering an array of elements with .map() in React?",
                "points": 1,
                "options": [
                    ("It helps React track which items have changed, been added, or removed for efficient virtual DOM reconciliation.", True),
                    ("It automatically sorts the list in ascending alphabetical order.", False),
                    ("It attaches a click listener to every item in the list.", False),
                    ("It prevents items from overlapping visually on the screen.", False),
                ],
            },
            {
                "text": "Which JSX syntax is used to evaluate a dynamic JavaScript expression inside HTML markup?",
                "points": 1,
                "options": [
                    ("Single curly braces: {expression}", True),
                    ("Double brackets: [[expression]]", False),
                    ("Parentheses: (expression)", False),
                    ("Dollar template: ${expression}", False),
                ],
            },
            {
                "text": "What is the recommended syntax for conditionally rendering a component only when a boolean condition is true?",
                "points": 1,
                "options": [
                    ("{condition && <Component />}", True),
                    ("<if condition><Component /></if>", False),
                    ("{condition ? return <Component />}", False),
                    ("<Component render={condition} />", False),
                ],
            },
        ],
    },
    ("Introduction to React", 2, 9): {
        "title": "State Management & Event Handling Assessment",
        "description": "Test your knowledge of the useState hook, state immutability, event handlers, and controlled inputs.",
        "questions": [
            {
                "text": "What does invoking the useState(initialValue) hook return?",
                "points": 1,
                "options": [
                    ("An array with two elements: the current state value and a state updater function.", True),
                    ("A JavaScript object containing get and set methods.", False),
                    ("The state value directly without an updater function.", False),
                    ("A Promise that resolves after the component mounts.", False),
                ],
            },
            {
                "text": "Why should you never mutate React state directly (e.g. stateArray.push(newItem))?",
                "points": 1,
                "options": [
                    ("React detects changes by reference comparison; direct mutation does not trigger a re-render.", True),
                    ("It throws a fatal syntax error in strict mode.", False),
                    ("It deletes the component from the virtual DOM.", False),
                    ("Direct mutation causes memory leaks in the browser.", False),
                ],
            },
            {
                "text": "What is the proper way to add an element to an array stored in React state?",
                "points": 1,
                "options": [
                    ("setItems(prevItems => [...prevItems, newItem]);", True),
                    ("items.push(newItem); setItems(items);", False),
                    ("setItems(items.concat().push(newItem));", False),
                    ("setItems(new Array(items, newItem));", False),
                ],
            },
            {
                "text": "What defines a 'controlled component' in React form handling?",
                "points": 1,
                "options": [
                    ("An input element whose displayed value is driven by React state and updated via an onChange handler.", True),
                    ("A component that requires administrator login credentials to render.", False),
                    ("A component that cannot be unmounted by user actions.", False),
                    ("A component managed directly by native DOM APIs.", False),
                ],
            },
            {
                "text": "Why is using an updater callback function (e.g. setCount(prev => prev + 1)) recommended for state updates based on previous state?",
                "points": 1,
                "options": [
                    ("Because React batches state updates asynchronously, ensuring the updater receives the most current state value.", True),
                    ("Because updater functions run on a separate background thread.", False),
                    ("Because normal setter calls do not support integer values.", False),
                    ("Because it prevents React from re-rendering the component.", False),
                ],
            },
        ],
    },
    ("Introduction to React", 3, 5): {
        "title": "Advanced React Hooks & Component Lifecycle",
        "description": "Assess your skills with useEffect, useContext, useRef, and full interactive React applications.",
        "questions": [
            {
                "text": "What happens when an empty dependency array ([]) is passed to useEffect()?",
                "points": 1,
                "options": [
                    ("The effect callback runs exactly once after the initial render of the component.", True),
                    ("The effect runs after every single component render.", False),
                    ("The effect is ignored and never runs.", False),
                    ("React throws a compile-time hook error.", False),
                ],
            },
            {
                "text": "What is the purpose of returning a function from inside a useEffect callback?",
                "points": 1,
                "options": [
                    ("It acts as a cleanup function to clear timers, cancel subscriptions, or remove event listeners.", True),
                    ("It provides the return value for the component's JSX markup.", False),
                    ("It forces the effect to re-run immediately.", False),
                    ("It triggers a child component re-render.", False),
                ],
            },
            {
                "text": "What is the fundamental difference between useRef and useState in React?",
                "points": 1,
                "options": [
                    ("Updating a useRef value does not trigger a component re-render, whereas updating useState does.", True),
                    ("useRef values are wiped on every render, while useState values persist.", False),
                    ("useRef can only store strings, while useState stores objects.", False),
                    ("useRef is asynchronous, while useState is synchronous.", False),
                ],
            },
            {
                "text": "What problem does the useContext hook primarily solve in React architecture?",
                "points": 1,
                "options": [
                    ("It provides global access to shared state without having to manually pass props down multiple levels (prop drilling).", True),
                    ("It replaces CSS stylesheets with inline styles.", False),
                    ("It automatically manages backend database connections.", False),
                    ("It compiles JSX into machine binary.", False),
                ],
            },
            {
                "text": "If a state variable or prop is referenced inside a useEffect callback, what should you do with the dependency array?",
                "points": 1,
                "options": [
                    ("Include that variable in the dependency array so the effect re-runs when its value changes.", True),
                    ("Leave the dependency array empty to prevent re-renders.", False),
                    ("Omit the dependency array entirely.", False),
                    ("Convert the variable into a global window variable.", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 5. Introduction to Full-Stack Development (4 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to Full-Stack Development", 1, 14): {
        "title": "Full-Stack Web Foundations: HTML & HTTP",
        "description": "Assess your understanding of the client-server model, semantic HTML markup, and HTTP communications.",
        "questions": [
            {
                "text": "In a modern full-stack web application, what is the core role of the client (frontend) versus the server (backend)?",
                "points": 1,
                "options": [
                    ("The client renders the user interface and handles user events, while the server executes business logic and database operations.", True),
                    ("The client hosts the production database, while the server runs CSS styling.", False),
                    ("The client and server perform identical operations redundantly.", False),
                    ("The client is only used during offline mode.", False),
                ],
            },
            {
                "text": "Which HTTP status code family indicates that an API request was processed successfully by the server?",
                "points": 1,
                "options": [
                    ("2xx (e.g. 200 OK, 201 Created)", True),
                    ("4xx (e.g. 400 Bad Request)", False),
                    ("5xx (e.g. 500 Internal Server Error)", False),
                    ("3xx (e.g. 301 Moved Permanently)", False),
                ],
            },
            {
                "text": "What data interchange format is universally utilized for exchanging structured data between modern frontends and REST APIs?",
                "points": 1,
                "options": [
                    ("JSON (JavaScript Object Notation)", True),
                    ("XML Soap Envelopes", False),
                    ("Raw CSV Strings", False),
                    ("YAML Documents", False),
                ],
            },
            {
                "text": "What is the primary difference between HTTP GET and POST requests?",
                "points": 1,
                "options": [
                    ("GET requests retrieve resources without modifying server state, while POST sends payload data to create or update resources.", True),
                    ("GET is encrypted while POST is plaintext.", False),
                    ("GET can only be used on desktop computers.", False),
                    ("POST requests cannot return data in their response.", False),
                ],
            },
            {
                "text": "Why is input validation critical on BOTH the frontend client and the backend server?",
                "points": 1,
                "options": [
                    ("Frontend validation improves user experience, while backend validation is mandatory to ensure security and data integrity.", True),
                    ("Because frontend validation is ignored by modern web browsers.", False),
                    ("Because backend validation only checks password fields.", False),
                    ("Dual validation is unnecessary; frontend validation is completely sufficient.", False),
                ],
            },
        ],
    },
    ("Introduction to Full-Stack Development", 2, 13): {
        "title": "Full-Stack Web Styling: Modern CSS & Responsive Layouts",
        "description": "Test your mastery of responsive design, CSS variables, and layout systems in full-stack web apps.",
        "questions": [
            {
                "text": "Which CSS feature enables a web application to adapt its layout and styling to different screen resolutions and viewports?",
                "points": 1,
                "options": [
                    ("CSS Media Queries (@media)", True),
                    ("CSS Transitions", False),
                    ("CSS Transforms", False),
                    ("CSS Font Face Rules", False),
                ],
            },
            {
                "text": "What is the design philosophy behind 'Mobile-First' responsive design?",
                "points": 1,
                "options": [
                    ("Designing styles for mobile viewports as base styles, then using min-width media queries to enhance for larger screens.", True),
                    ("Writing native mobile apps before writing web code.", False),
                    ("Restricting website access exclusively to mobile phones.", False),
                    ("Disabling desktop browser navigation.", False),
                ],
            },
            {
                "text": "How does CSS Grid fundamentally differ from CSS Flexbox in web development?",
                "points": 1,
                "options": [
                    ("CSS Grid is two-dimensional (handling both rows and columns simultaneously), whereas Flexbox is primarily one-dimensional.", True),
                    ("CSS Grid only works with images, while Flexbox works with text.", False),
                    ("CSS Grid requires an external JavaScript library to function.", False),
                    ("Flexbox has been deprecated in favor of CSS Grid.", False),
                ],
            },
            {
                "text": "What is the primary advantage of utilizing CSS custom properties (variables like --ks-primary)?",
                "points": 1,
                "options": [
                    ("They allow centralizing design tokens (colors, spacing) for easy theming and consistent site-wide styling.", True),
                    ("They execute database SQL queries from the browser.", False),
                    ("They reduce image download sizes.", False),
                    ("They replace JavaScript event listeners.", False),
                ],
            },
            {
                "text": "What does the rem unit calculate size relative to in CSS?",
                "points": 1,
                "options": [
                    ("The font size of the root <html> element.", True),
                    ("The font size of the immediate parent element.", False),
                    ("The viewport width.", False),
                    ("The device's physical screen pixel count.", False),
                ],
            },
        ],
    },
    ("Introduction to Full-Stack Development", 3, 80): {
        "title": "Full-Stack Core Logic: JavaScript, APIs & Async Flow",
        "description": "Evaluate your proficiency with client-side API consumption, async flow, token storage, and REST architecture.",
        "questions": [
            {
                "text": "When making an authenticated API request, how is a JWT bearer token typically transmitted to the backend?",
                "points": 1,
                "options": [
                    ("In the HTTP Authorization header as 'Bearer <token>'.", True),
                    ("As a URL query string parameter in the browser address bar.", False),
                    ("In the HTML title element.", False),
                    ("In the body of a GET request.", False),
                ],
            },
            {
                "text": "What is CORS (Cross-Origin Resource Sharing) in web application architecture?",
                "points": 1,
                "options": [
                    ("A browser security mechanism that restricts web pages from requesting resources from a different origin unless permitted.", True),
                    ("A server database protocol for replicating tables.", False),
                    ("A JavaScript bundler that minifies source code.", False),
                    ("An image compression format.", False),
                ],
            },
            {
                "text": "What does it mean for a RESTful web API to be 'stateless'?",
                "points": 1,
                "options": [
                    ("The server does not retain client session context between requests; each request contains all authentication needed.", True),
                    ("The server does not connect to any database.", False),
                    ("The API cannot return error responses.", False),
                    ("The server never reboots.", False),
                ],
            },
            {
                "text": "What HTTP method should be used to remove an item located at /api/v1/courses/10?",
                "points": 1,
                "options": [
                    ("DELETE", True),
                    ("REMOVE", False),
                    ("DROP", False),
                    ("CLEAR", False),
                ],
            },
            {
                "text": "What does a 401 Unauthorized HTTP status code indicate to the frontend client?",
                "points": 1,
                "options": [
                    ("The request lacks valid authentication credentials, so the user should be prompted to log in.", True),
                    ("The requested URL path was not found on the server.", False),
                    ("The database experienced an unrecoverable crash.", False),
                    ("The user's network connection is offline.", False),
                ],
            },
        ],
    },
    ("Introduction to Full-Stack Development", 4, 20): {
        "title": "Full-Stack Frontend Architecture: React & UI Integration",
        "description": "Test your ability to integrate React component architecture, state management, and backend services.",
        "questions": [
            {
                "text": "Where is the appropriate place in a React component to perform an initial API data fetch?",
                "points": 1,
                "options": [
                    ("Inside a useEffect hook with an empty dependency array ([]).", True),
                    ("In the main render body of the component directly.", False),
                    ("In the index.html head tag.", False),
                    ("Inside a setTimeout block outside React.", False),
                ],
            },
            {
                "text": "What should a well-designed frontend display to users while an asynchronous API request is in-flight?",
                "points": 1,
                "options": [
                    ("A loading spinner, skeleton placeholder, or clear progress indicator.", True),
                    ("A blank empty white screen.", False),
                    ("A 404 Not Found error screen.", False),
                    ("An alert modal saying the server is unreachable.", False),
                ],
            },
            {
                "text": "What is the purpose of modern frontend build tools like Vite in full-stack applications?",
                "points": 1,
                "options": [
                    ("They bundle, transpile, and optimize JSX and assets for rapid development and efficient production deployment.", True),
                    ("They host PostgreSQL database tables.", False),
                    ("They handle server-side database migrations.", False),
                    ("They configure domain DNS servers.", False),
                ],
            },
            {
                "text": "How should client-side authentication status be managed across diverse pages in a React application?",
                "points": 1,
                "options": [
                    ("Via a centralized AuthContext provider and custom useAuth hook.", True),
                    ("By storing passwords in document.cookie as plaintext.", False),
                    ("By re-entering the password on every single route transition.", False),
                    ("By passing credentials as URL query parameters.", False),
                ],
            },
            {
                "text": "What HTTP status code represents successful resource creation (e.g. creating a new course or quiz attempt)?",
                "points": 1,
                "options": [
                    ("201 Created", True),
                    ("200 OK", False),
                    ("204 No Content", False),
                    ("202 Accepted", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 6. Introduction to Java (5 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to Java", 1, 10): {
        "title": "Java Fundamentals, Types & Scanner Assessment",
        "description": "Test your foundation in Java compilation, primitive types, the Scanner class, and arithmetic operations.",
        "questions": [
            {
                "text": "What is the primary role of the Java Virtual Machine (JVM)?",
                "points": 1,
                "options": [
                    ("It executes compiled Java bytecode (.class files), providing cross-platform portability.", True),
                    ("It translates Java code directly into Python scripts.", False),
                    ("It manages SQL database queries.", False),
                    ("It automatically formats source code indentation.", False),
                ],
            },
            {
                "text": "Which Java primitive data type is used to store boolean true or false values?",
                "points": 1,
                "options": [
                    ("bool", False),
                    ("boolean", True),
                    ("bit", False),
                    ("BooleanType", False),
                ],
            },
            {
                "text": "Which class from java.util is commonly used to read console keyboard input in Java?",
                "points": 1,
                "options": [
                    ("ConsoleReader", False),
                    ("Scanner", True),
                    ("InputManager", False),
                    ("StreamScanner", False),
                ],
            },
            {
                "text": "In System.out.printf('Price: %.2f', price);, what does the '%.2f' format specifier designate?",
                "points": 1,
                "options": [
                    ("A floating-point number formatted with exactly two decimal places.", True),
                    ("A float multiplied by 2.", False),
                    ("An integer rounded to 2 digits.", False),
                    ("A string truncated after 2 characters.", False),
                ],
            },
            {
                "text": "What is the signature of the entry point method in every executable Java console program?",
                "points": 1,
                "options": [
                    ("public static void main(String[] args)", True),
                    ("public void main(String args)", False),
                    ("static void main()", False),
                    ("public int main(String[] argv)", False),
                ],
            },
        ],
    },
    ("Introduction to Java", 2, 15): {
        "title": "Java Control Flow, Strings & Loops",
        "description": "Assess your skills with conditional statements, String methods, switch expressions, and loop iterations.",
        "questions": [
            {
                "text": "What is the correct way to compare two String objects for text content equality in Java?",
                "points": 1,
                "options": [
                    ("str1.equals(str2)", True),
                    ("str1 == str2", False),
                    ("str1 === str2", False),
                    ("str1.compareTo(str2) == true", False),
                ],
            },
            {
                "text": "What does the break statement do when encountered inside a Java for or while loop?",
                "points": 1,
                "options": [
                    ("It immediately terminates the loop and transfers execution to the statement following the loop.", True),
                    ("It skips the current iteration and jumps to the next iteration.", False),
                    ("It pauses execution for 100 milliseconds.", False),
                    ("It exits the entire application.", False),
                ],
            },
            {
                "text": "What does 'Kitsuno'.length() return in Java?",
                "points": 1,
                "options": [
                    ("7", True),
                    ("6", False),
                    ("8", False),
                    ("0", False),
                ],
            },
            {
                "text": "Which loop structure in Java is guaranteed to execute its code block at least once before testing the condition?",
                "points": 1,
                "options": [
                    ("do-while loop", True),
                    ("while loop", False),
                    ("for loop", False),
                    ("enhanced for loop", False),
                ],
            },
            {
                "text": "What does the continue statement do inside a loop?",
                "points": 1,
                "options": [
                    ("It halts the current iteration and immediately begins the next iteration of the loop.", True),
                    ("It permanently exits the loop.", False),
                    ("It restarts the loop from index 0.", False),
                    ("It breaks out of nested loops.", False),
                ],
            },
        ],
    },
    ("Introduction to Java", 3, 13): {
        "title": "Java Methods, Overloading & Arrays",
        "description": "Evaluate your understanding of modular methods, method overloading, variable scope, and 1D/2D arrays.",
        "questions": [
            {
                "text": "What constitutes 'method overloading' in Java?",
                "points": 1,
                "options": [
                    ("Defining multiple methods within the same class with identical names but differing parameter lists.", True),
                    ("Redefining a superclass method inside a subclass.", False),
                    ("Calling a method recursively without a base case.", False),
                    ("Passing more arguments than the method specifies.", False),
                ],
            },
            {
                "text": "How do you find the number of elements in a Java array declared as int[] scores = new int[10];?",
                "points": 1,
                "options": [
                    ("scores.length", True),
                    ("scores.length()", False),
                    ("scores.size()", False),
                    ("scores.count", False),
                ],
            },
            {
                "text": "What is the default value of elements in an uninitialized Java int[] array?",
                "points": 1,
                "options": [
                    ("0", True),
                    ("null", False),
                    ("-1", False),
                    ("undefined", False),
                ],
            },
            {
                "text": "In a 2D array declared as int[][] grid = new int[3][4];, how many rows and columns are created?",
                "points": 1,
                "options": [
                    ("3 rows and 4 columns", True),
                    ("4 rows and 3 columns", False),
                    ("7 rows and 1 column", False),
                    ("12 rows and 12 columns", False),
                ],
            },
            {
                "text": "Which keyword specifies that a Java method does not return any value to the caller?",
                "points": 1,
                "options": [
                    ("void", True),
                    ("null", False),
                    ("empty", False),
                    ("none", False),
                ],
            },
        ],
    },
    ("Introduction to Java", 4, 17): {
        "title": "Java Object-Oriented Programming (OOP) Assessment",
        "description": "Test your mastery of classes, constructors, static members, inheritance, polymorphism, and encapsulation.",
        "questions": [
            {
                "text": "What is the primary role of a constructor in a Java class?",
                "points": 1,
                "options": [
                    ("A special method called automatically when creating a new object instance to initialize its state.", True),
                    ("A method that deletes objects from system memory.", False),
                    ("A method that compiles the class into bytecode.", False),
                    ("A utility method for printing object details.", False),
                ],
            },
            {
                "text": "What does the static keyword signify when applied to a class field or method?",
                "points": 1,
                "options": [
                    ("The member belongs to the class itself rather than to individual instances of the class.", True),
                    ("The member cannot be altered once assigned.", False),
                    ("The member can only be accessed by the operating system.", False),
                    ("The member is stored in thread-local storage.", False),
                ],
            },
            {
                "text": "Which Java keyword allows a subclass to inherit attributes and methods from a superclass?",
                "points": 1,
                "options": [
                    ("extends", True),
                    ("implements", False),
                    ("inherits", False),
                    ("super", False),
                ],
            },
            {
                "text": "What core OOP principle is demonstrated by declaring instance variables private and providing public getters and setters?",
                "points": 1,
                "options": [
                    ("Encapsulation", True),
                    ("Polymorphism", False),
                    ("Inheritance", False),
                    ("Abstraction", False),
                ],
            },
            {
                "text": "What does the super keyword represent inside a subclass constructor or method?",
                "points": 1,
                "options": [
                    ("A reference to the immediate superclass (parent class) of the current object.", True),
                    ("A reference to the top-level java.lang.Object class.", False),
                    ("An instruction to execute code with elevated administrative privileges.", False),
                    ("A keyword that creates a new thread.", False),
                ],
            },
        ],
    },
    ("Introduction to Java", 5, 16): {
        "title": "Java Collections, Exceptions & Concurrency",
        "description": "Assess your understanding of ArrayList, HashMap, exception handling, and multithreading in Java.",
        "questions": [
            {
                "text": "What is the key advantage of an ArrayList compared to a fixed-length standard Java array?",
                "points": 1,
                "options": [
                    ("An ArrayList dynamically resizes as elements are added or removed.", True),
                    ("An ArrayList can directly store primitive int values without autoboxing.", False),
                    ("An ArrayList cannot contain duplicate values.", False),
                    ("An ArrayList does not require memory allocation.", False),
                ],
            },
            {
                "text": "In a HashMap<String, Integer>, which method adds or updates a key-value mapping?",
                "points": 1,
                "options": [
                    ("map.put('key', value);", True),
                    ("map.add('key', value);", False),
                    ("map.insert('key', value);", False),
                    ("map.set('key', value);", False),
                ],
            },
            {
                "text": "What is the guaranteed behavior of a finally block in Java try-catch-finally exception handling?",
                "points": 1,
                "options": [
                    ("It always executes whether an exception was thrown, caught, or not thrown at all.", True),
                    ("It executes only when an unhandled exception crashes the program.", False),
                    ("It executes only if no exception occurred.", False),
                    ("It suppresses all logged exceptions.", False),
                ],
            },
            {
                "text": "Which functional interface should be implemented to define task code that runs on a separate Java Thread?",
                "points": 1,
                "options": [
                    ("Runnable", True),
                    ("Executable", False),
                    ("ThreadTask", False),
                    ("CallableInterface", False),
                ],
            },
            {
                "text": "What is the difference between checked and unchecked exceptions in Java?",
                "points": 1,
                "options": [
                    ("Checked exceptions must be explicitly caught or declared in throws at compile time, while unchecked exceptions (RuntimeException) do not.", True),
                    ("Checked exceptions crash the JVM immediately, while unchecked exceptions are ignored.", False),
                    ("Checked exceptions only occur in web applications.", False),
                    ("Checked exceptions are written in C++.", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 7. Introduction to MongoDB (3 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to MongoDB", 1, 2): {
        "title": "MongoDB Fundamentals & Setup Assessment",
        "description": "Test your knowledge of NoSQL concepts, BSON documents, collections, and the mongosh environment.",
        "questions": [
            {
                "text": "How does MongoDB store data compared to a traditional relational SQL database?",
                "points": 1,
                "options": [
                    ("As flexible, schema-free BSON (Binary JSON) documents organized inside collections.", True),
                    ("As static tabular rows and columns with fixed schemas.", False),
                    ("As plaintext comma-separated CSV files on disk.", False),
                    ("As compiled XML trees.", False),
                ],
            },
            {
                "text": "What is the MongoDB structural equivalent of a 'table' in SQL databases?",
                "points": 1,
                "options": [
                    ("Collection", True),
                    ("Document", False),
                    ("Row", False),
                    ("Schema", False),
                ],
            },
            {
                "text": "In the mongosh shell, which command switches to (or creates) a database named 'kitsuno_db'?",
                "points": 1,
                "options": [
                    ("use kitsuno_db", True),
                    ("switch kitsuno_db", False),
                    ("connect kitsuno_db", False),
                    ("open database kitsuno_db", False),
                ],
            },
            {
                "text": "What is the purpose of the mandatory _id field automatically generated for every MongoDB document?",
                "points": 1,
                "options": [
                    ("It functions as a unique primary key identifier for the document within the collection.", True),
                    ("It stores the encryption key for the database.", False),
                    ("It specifies the foreign key relationship to parent tables.", False),
                    ("It counts how many times the document was updated.", False),
                ],
            },
            {
                "text": "Which command lists all available databases in the current MongoDB instance?",
                "points": 1,
                "options": [
                    ("show dbs", True),
                    ("list databases", False),
                    ("get databases", False),
                    ("display dbs", False),
                ],
            },
        ],
    },
    ("Introduction to MongoDB", 2, 6): {
        "title": "MongoDB CRUD Operations & Data Types",
        "description": "Assess your skills with inserting, querying, updating, and deleting documents in MongoDB.",
        "questions": [
            {
                "text": "Which method inserts a single document into a collection named 'students' in MongoDB?",
                "points": 1,
                "options": [
                    ("db.students.insertOne({ name: 'Alex', grade: 90 })", True),
                    ("db.students.add({ name: 'Alex', grade: 90 })", False),
                    ("db.students.insert({ name: 'Alex', grade: 90 })", False),
                    ("db.students.create({ name: 'Alex', grade: 90 })", False),
                ],
            },
            {
                "text": "Which method retrieves all documents in a collection that match a query criteria?",
                "points": 1,
                "options": [
                    ("db.collection.find(query)", True),
                    ("db.collection.search(query)", False),
                    ("db.collection.select(query)", False),
                    ("db.collection.query(query)", False),
                ],
            },
            {
                "text": "What does the $set update operator do when updating a document in MongoDB?",
                "points": 1,
                "options": [
                    ("It modifies or creates specified fields without overwriting the rest of the document.", True),
                    ("It wipes the document and replaces it with only the specified fields.", False),
                    ("It converts the document into an immutable set.", False),
                    ("It increments numeric values by 1.", False),
                ],
            },
            {
                "text": "How do you sort query results in descending order by the 'score' field in MongoDB?",
                "points": 1,
                "options": [
                    ("db.collection.find().sort({ score: -1 })", True),
                    ("db.collection.find().sort({ score: 1 })", False),
                    ("db.collection.find().sort({ score: 'desc' })", False),
                    ("db.collection.find().orderBy('score', 'desc')", False),
                ],
            },
            {
                "text": "Which method deletes the first document matching { status: 'pending' } from the orders collection?",
                "points": 1,
                "options": [
                    ("db.orders.deleteOne({ status: 'pending' })", True),
                    ("db.orders.removeOne({ status: 'pending' })", False),
                    ("db.orders.drop({ status: 'pending' })", False),
                    ("db.orders.clearOne({ status: 'pending' })", False),
                ],
            },
        ],
    },
    ("Introduction to MongoDB", 3, 4): {
        "title": "MongoDB Query Operators & Indexing Assessment",
        "description": "Test your mastery of comparison operators, logical operators, and collection indexing.",
        "questions": [
            {
                "text": "Which comparison operator filters documents where the 'age' field is greater than 21?",
                "points": 1,
                "options": [
                    ("{ age: { $gt: 21 } }", True),
                    ("{ age: { $more: 21 } }", False),
                    ("{ age: { $above: 21 } }", False),
                    ("{ age: > 21 }", False),
                ],
            },
            {
                "text": "Which logical operator matches documents that satisfy at least one of multiple query conditions?",
                "points": 1,
                "options": [
                    ("$or", True),
                    ("$and", False),
                    ("$any", False),
                    ("$either", False),
                ],
            },
            {
                "text": "What is the primary benefit of creating indexes on frequently queried fields in MongoDB?",
                "points": 1,
                "options": [
                    ("Indexes speed up search and query operations by avoiding full collection scans.", True),
                    ("Indexes compress documents to take up zero disk space.", False),
                    ("Indexes prevent documents from ever being deleted.", False),
                    ("Indexes automatically validate email addresses.", False),
                ],
            },
            {
                "text": "What does the query filter { role: { $in: ['admin', 'manager'] } } match?",
                "points": 1,
                "options": [
                    ("Documents where role is equal to either 'admin' or 'manager'.", True),
                    ("Documents where role contains both 'admin' and 'manager' at the same time.", False),
                    ("Documents where role is neither 'admin' nor 'manager'.", False),
                    ("Documents where role is a nested array.", False),
                ],
            },
            {
                "text": "Which method creates an ascending index on the 'username' field in the 'users' collection?",
                "points": 1,
                "options": [
                    ("db.users.createIndex({ username: 1 })", True),
                    ("db.users.addIndex('username', 'asc')", False),
                    ("db.users.index({ username: true })", False),
                    ("db.users.makeIndex('username')", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 8. Introduction to C (5 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to C", 1, 10): {
        "title": "C Basics, Types & Arithmetic Assessment",
        "description": "Test your fundamentals in C compilation, basic types, format specifiers, and console I/O.",
        "questions": [
            {
                "text": "What format specifier is used in printf() to print a standard signed decimal integer in C?",
                "points": 1,
                "options": [
                    ("%d", True),
                    ("%int", False),
                    ("%s", False),
                    ("%f", False),
                ],
            },
            {
                "text": "Why must you prefix variable names with the address-of operator (&) in scanf('%d', &age);?",
                "points": 1,
                "options": [
                    ("scanf requires the variable's memory address so it can write the input directly into that memory location.", True),
                    ("The & symbol converts user input into a floating-point number.", False),
                    ("The & symbol prevents buffer overflows automatically.", False),
                    ("The & symbol initializes the variable to zero.", False),
                ],
            },
            {
                "text": "What integer value does the main() function conventionally return to indicate successful execution?",
                "points": 1,
                "options": [
                    ("0", True),
                    ("1", False),
                    ("-1", False),
                    ("255", False),
                ],
            },
            {
                "text": "What is the standard byte size of a char data type in ANSI C?",
                "points": 1,
                "options": [
                    ("1 byte (8 bits)", True),
                    ("2 bytes", False),
                    ("4 bytes", False),
                    ("8 bytes", False),
                ],
            },
            {
                "text": "Which standard header file must be included to utilize printf() and scanf() in C?",
                "points": 1,
                "options": [
                    ("#include <stdio.h>", True),
                    ("#include <stdlib.h>", False),
                    ("#include <iostream>", False),
                    ("#include <conio.h>", False),
                ],
            },
        ],
    },
    ("Introduction to C", 2, 7): {
        "title": "C Control Flow & Decision Making",
        "description": "Evaluate your understanding of if/else conditionals, logical operators, and switch statements in C.",
        "questions": [
            {
                "text": "In C, how are truth and falsehood represented in conditional expressions?",
                "points": 1,
                "options": [
                    ("0 represents false, and any non-zero numeric value represents true.", True),
                    ("1 represents false, and 0 represents true.", False),
                    ("Only negative numbers represent false.", False),
                    ("C requires the native boolean keyword in all expressions.", False),
                ],
            },
            {
                "text": "What does the logical AND operator (&&) evaluate to in C?",
                "points": 1,
                "options": [
                    ("1 (true) only if both operands evaluate to non-zero values.", True),
                    ("1 (true) if either operand evaluates to non-zero.", False),
                    ("1 (true) if neither operand evaluates to non-zero.", False),
                    ("It performs bitwise shifting on the first operand.", False),
                ],
            },
            {
                "text": "What occurs in a switch statement if a case executes without a break statement?",
                "points": 1,
                "options": [
                    ("Execution falls through into the subsequent case blocks until a break or the end of the switch is encountered.", True),
                    ("The program immediately terminates with a segmentation fault.", False),
                    ("The compiler reports a syntax error.", False),
                    ("Only the default block is executed.", False),
                ],
            },
            {
                "text": "What does the logical NOT expression !(10 > 5) evaluate to in C?",
                "points": 1,
                "options": [
                    ("0", True),
                    ("1", False),
                    ("-1", False),
                    ("undefined", False),
                ],
            },
            {
                "text": "What is the syntax of the ternary conditional operator in C?",
                "points": 1,
                "options": [
                    ("condition ? expression_true : expression_false", True),
                    ("condition -> expression_true : expression_false", False),
                    ("if (condition) ? true : false", False),
                    ("condition ?? expression_true : expression_false", False),
                ],
            },
        ],
    },
    ("Introduction to C", 3, 12): {
        "title": "C Functions, Loops & Scope Assessment",
        "description": "Test your mastery of function prototypes, variable scope, while and for loops, and algorithms.",
        "questions": [
            {
                "text": "Why are function prototypes placed at the top of a C program before main()?",
                "points": 1,
                "options": [
                    ("To declare the function's name, return type, and parameters to the compiler before its definition is reached.", True),
                    ("To allocate dynamic heap memory for the function.", False),
                    ("To prevent other files from accessing the function.", False),
                    ("Because C cannot invoke functions with return types.", False),
                ],
            },
            {
                "text": "What will be printed by: int i = 0; while (i < 4) { i++; } printf('%d', i);?",
                "points": 1,
                "options": [
                    ("4", True),
                    ("3", False),
                    ("5", False),
                    ("0", False),
                ],
            },
            {
                "text": "What action does the continue statement perform inside a C loop?",
                "points": 1,
                "options": [
                    ("It skips the remainder of the current loop iteration and moves directly to the next loop cycle.", True),
                    ("It breaks out of the loop permanently.", False),
                    ("It restarts main() from the beginning.", False),
                    ("It pauses execution for one second.", False),
                ],
            },
            {
                "text": "What is the scope of a local variable declared inside a C function?",
                "points": 1,
                "options": [
                    ("It is only accessible within that specific function block.", True),
                    ("It can be read anywhere within the source file.", False),
                    ("It is automatically exported as a global variable.", False),
                    ("It persists across all running processes.", False),
                ],
            },
            {
                "text": "Which loop in C is guaranteed to execute its block at least once, even if the condition is initially false?",
                "points": 1,
                "options": [
                    ("do-while loop", True),
                    ("while loop", False),
                    ("for loop", False),
                    ("nested for loop", False),
                ],
            },
        ],
    },
    ("Introduction to C", 4, 5): {
        "title": "C Arrays, Matrices & String Handling",
        "description": "Assess your skills with array indexing, multidimensional matrices, null terminators, and string functions.",
        "questions": [
            {
                "text": "What character is used in C to mark the end of a valid string array in memory?",
                "points": 1,
                "options": [
                    ("The null terminator '\\0'", True),
                    ("The newline character '\\n'", False),
                    ("The EOF character", False),
                    ("The space character ' '", False),
                ],
            },
            {
                "text": "How many total bytes of memory are occupied by int arr[10]; assuming sizeof(int) == 4?",
                "points": 1,
                "options": [
                    ("40 bytes", True),
                    ("10 bytes", False),
                    ("20 bytes", False),
                    ("80 bytes", False),
                ],
            },
            {
                "text": "What value does strcmp(str1, str2) return when both strings are identical?",
                "points": 1,
                "options": [
                    ("0", True),
                    ("1", False),
                    ("-1", False),
                    ("true", False),
                ],
            },
            {
                "text": "In C, what is the index of the first element in any array?",
                "points": 1,
                "options": [
                    ("0", True),
                    ("1", False),
                    ("-1", False),
                    ("null", False),
                ],
            },
            {
                "text": "What does passing an array name without brackets into a C function actually pass?",
                "points": 1,
                "options": [
                    ("A pointer to the first element of the array.", True),
                    ("A full deep clone copy of the entire array.", False),
                    ("The length count of the array.", False),
                    ("A read-only immutable slice.", False),
                ],
            },
        ],
    },
    ("Introduction to C", 5, 12): {
        "title": "C Pointers, Memory Management & Structs",
        "description": "Test your mastery of pointers, dynamic memory allocation (malloc/free), structs, and typedefs.",
        "questions": [
            {
                "text": "What does the dereference operator (*) do when used with a pointer variable (e.g. *ptr = 50;)?",
                "points": 1,
                "options": [
                    ("It accesses or modifies the value stored at the memory address the pointer points to.", True),
                    ("It multiplies the memory address by 50.", False),
                    ("It deallocates the pointer from memory.", False),
                    ("It checks if the pointer is null.", False),
                ],
            },
            {
                "text": "Which standard library function dynamically allocates a block of memory of specified bytes on the heap?",
                "points": 1,
                "options": [
                    ("malloc()", True),
                    ("alloc()", False),
                    ("new()", False),
                    ("create_heap()", False),
                ],
            },
            {
                "text": "Why must free(ptr); be called after finishing with dynamically allocated memory in C?",
                "points": 1,
                "options": [
                    ("To release heap memory back to the operating system and avoid memory leaks.", True),
                    ("To set the pointer variable to NULL automatically.", False),
                    ("To erase the pointer from the source code.", False),
                    ("To flush the CPU cache.", False),
                ],
            },
            {
                "text": "What is the purpose of the struct keyword in C programming?",
                "points": 1,
                "options": [
                    ("To define a user-created composite data type grouping variables of different types under one name.", True),
                    ("To define an object-oriented class with inheritance.", False),
                    ("To optimize loops for GPU acceleration.", False),
                    ("To prevent variables from being modified.", False),
                ],
            },
            {
                "text": "Which operator is used to access a struct member when working with a pointer to that struct (e.g. Person *p;)?",
                "points": 1,
                "options": [
                    ("The arrow operator: p->name", True),
                    ("The dot operator only: p.name", False),
                    ("The scope resolution operator: p::name", False),
                    ("The fat arrow operator: p=>name", False),
                ],
            },
        ],
    },

    # -------------------------------------------------------------------------
    # 9. Introduction to Python (5 Quizzes)
    # -------------------------------------------------------------------------
    ("Introduction to Python", 1, 15): {
        "title": "Python Fundamentals & Control Flow Assessment",
        "description": "Test your mastery of Python syntax, data types, type casting, if-elif-else statements, and format specifiers.",
        "questions": [
            {
                "text": "What does type(3.14159) evaluate to in Python?",
                "points": 1,
                "options": [
                    ("<class 'float'>", True),
                    ("<class 'int'>", False),
                    ("<class 'double'>", False),
                    ("<class 'decimal'>", False),
                ],
            },
            {
                "text": "What data type does the built-in input() function always return in Python 3?",
                "points": 1,
                "options": [
                    ("str (string)", True),
                    ("int (integer)", False),
                    ("float (floating point)", False),
                    ("It automatically infers the data type.", False),
                ],
            },
            {
                "text": "What is the result of string slicing 'Python'[1:4]?",
                "points": 1,
                "options": [
                    ("'yth'", True),
                    ("'Pyt'", False),
                    ("'ytho'", False),
                    ("'y'", False),
                ],
            },
            {
                "text": "Which keyword is used in Python for an 'else if' conditional branch?",
                "points": 1,
                "options": [
                    ("elif", True),
                    ("else if", False),
                    ("elseif", False),
                    ("when", False),
                ],
            },
            {
                "text": "In Python f-strings, how do you format a float variable val = 9.8765 to display with 2 decimal places?",
                "points": 1,
                "options": [
                    ("f'{val:.2f}'", True),
                    ("f'{val.2f}'", False),
                    ("f'{val % 2}'", False),
                    ("f'{val->2}'", False),
                ],
            },
        ],
    },
    ("Introduction to Python", 2, 16): {
        "title": "Python Loops, Collections & Dictionaries",
        "description": "Evaluate your proficiency with while/for loops, lists, tuples, sets, and dictionaries in Python.",
        "questions": [
            {
                "text": "What is the primary difference between a Python list and a Python tuple?",
                "points": 1,
                "options": [
                    ("A list is mutable (can be changed), while a tuple is immutable (cannot be modified after creation).", True),
                    ("A list can only store numbers, while a tuple can only store strings.", False),
                    ("A tuple does not preserve insertion order.", False),
                    ("A list cannot contain duplicate values.", False),
                ],
            },
            {
                "text": "Which Python collection type stores only unique items and automatically discards duplicate entries?",
                "points": 1,
                "options": [
                    ("set", True),
                    ("list", False),
                    ("tuple", False),
                    ("dict", False),
                ],
            },
            {
                "text": "What integers are generated by range(2, 6) in Python?",
                "points": 1,
                "options": [
                    ("2, 3, 4, 5", True),
                    ("2, 3, 4, 5, 6", False),
                    ("0, 1, 2, 3, 4, 5", False),
                    ("3, 4, 5", False),
                ],
            },
            {
                "text": "How do you safely retrieve a value from a dictionary my_dict without risking a KeyError if the key is missing?",
                "points": 1,
                "options": [
                    ("my_dict.get('key', default_value)", True),
                    ("my_dict['key', default_value]", False),
                    ("my_dict.find('key')", False),
                    ("my_dict.search('key')", False),
                ],
            },
            {
                "text": "Which list method adds a single element to the end of an existing list?",
                "points": 1,
                "options": [
                    ("append()", True),
                    ("push()", False),
                    ("add()", False),
                    ("insert_end()", False),
                ],
            },
        ],
    },
    ("Introduction to Python", 3, 15): {
        "title": "Python Functions, Scope & Modules Assessment",
        "description": "Test your mastery of custom functions, default/keyword arguments, *args/**kwargs, and modules.",
        "questions": [
            {
                "text": "What do *args and **kwargs accept in Python function definitions?",
                "points": 1,
                "options": [
                    ("*args accepts variable positional arguments as a tuple; **kwargs accepts variable keyword arguments as a dictionary.", True),
                    ("*args accepts pointers; **kwargs accepts class instances.", False),
                    ("*args accepts only integers; **kwargs accepts only strings.", False),
                    ("*args and **kwargs are used only in recursive algorithms.", False),
                ],
            },
            {
                "text": "What does the list comprehension [n ** 2 for n in [1, 2, 3]] produce?",
                "points": 1,
                "options": [
                    ("[1, 4, 9]", True),
                    ("[2, 4, 6]", False),
                    ("[1, 2, 3, 1, 2, 3]", False),
                    ("[1, 8, 27]", False),
                ],
            },
            {
                "text": "Why is the if __name__ == '__main__': block used in Python scripts?",
                "points": 1,
                "options": [
                    ("It ensures the enclosed code runs only when the file is executed directly, not when imported as a module.", True),
                    ("It declares the file as an executable system binary.", False),
                    ("It is required by the Python parser to declare functions.", False),
                    ("It checks if Python is running with administrative privileges.", False),
                ],
            },
            {
                "text": "If a variable is assigned inside a function without the global keyword, what scope does it have?",
                "points": 1,
                "options": [
                    ("Local scope (accessible only within that function)", True),
                    ("Global scope (accessible anywhere across the entire program)", False),
                    ("Module scope", False),
                    ("Built-in scope", False),
                ],
            },
            {
                "text": "Which statement exits a function and sends a result value back to the caller in Python?",
                "points": 1,
                "options": [
                    ("return", True),
                    ("yield_final", False),
                    ("send", False),
                    ("output", False),
                ],
            },
        ],
    },
    ("Introduction to Python", 4, 19): {
        "title": "Python Object-Oriented Programming Assessment",
        "description": "Assess your skills with classes, __init__, instance vs class variables, inheritance, and super().",
        "questions": [
            {
                "text": "What is the purpose of the self parameter in Python instance methods?",
                "points": 1,
                "options": [
                    ("It refers to the specific instance of the class calling the method, allowing access to its attributes.", True),
                    ("It acts as a global singleton.", False),
                    ("It references the parent class.", False),
                    ("It is an optional multithreading flag.", False),
                ],
            },
            {
                "text": "Which dunder method acts as the constructor called when instantiating a new Python class object?",
                "points": 1,
                "options": [
                    ("__init__()", True),
                    ("__new__() only", False),
                    ("__construct__()", False),
                    ("__create__()", False),
                ],
            },
            {
                "text": "How does a child class invoke an overridden method from its parent class in Python?",
                "points": 1,
                "options": [
                    ("super().method_name()", True),
                    ("parent().method_name()", False),
                    ("base.method_name()", False),
                    ("this.parent.method_name()", False),
                ],
            },
            {
                "text": "What is the distinction between a class variable and an instance variable in Python?",
                "points": 1,
                "options": [
                    ("Class variables are shared by all instances of the class; instance variables are unique to each individual instance.", True),
                    ("Class variables cannot be modified, while instance variables can.", False),
                    ("Class variables can only store strings.", False),
                    ("Instance variables are stored in an external database.", False),
                ],
            },
            {
                "text": "What does the built-in zip() function do when passed two lists: zip(['a', 'b'], [1, 2])?",
                "points": 1,
                "options": [
                    ("It aggregates elements into an iterator of tuples: [('a', 1), ('b', 2)].", True),
                    ("It compresses the lists into a .zip file on disk.", False),
                    ("It concatenates the second list to the end of the first list.", False),
                    ("It sorts both lists in place.", False),
                ],
            },
        ],
    },
    ("Introduction to Python", 5, 28): {
        "title": "Advanced Python, File I/O & GUIs Assessment",
        "description": "Evaluate your proficiency with exception handling, file read/write operations, and GUI desktop applications.",
        "questions": [
            {
                "text": "Why is the with open('file.txt', 'r') as f: statement best practice for working with files in Python?",
                "points": 1,
                "options": [
                    ("It automatically closes the file when the block exits, even if an exception occurs.", True),
                    ("It encrypts the file content on the hard drive.", False),
                    ("It reads the file using GPU acceleration.", False),
                    ("It prevents any other program from opening the file forever.", False),
                ],
            },
            {
                "text": "In a Python try-except-else-finally structure, when does the else block execute?",
                "points": 1,
                "options": [
                    ("Only if NO exceptions were raised in the try block.", True),
                    ("Whenever an exception is caught and suppressed.", False),
                    ("Always, regardless of exceptions.", False),
                    ("Only when a fatal error crashes the script.", False),
                ],
            },
            {
                "text": "Which file open mode should be used to append new lines to a file without overwriting existing contents?",
                "points": 1,
                "options": [
                    ("'a'", True),
                    ("'w'", False),
                    ("'r+'", False),
                    ("'x'", False),
                ],
            },
            {
                "text": "What exception is raised when attempting to access a non-existent key in a Python dictionary via my_dict[key]?",
                "points": 1,
                "options": [
                    ("KeyError", True),
                    ("IndexError", False),
                    ("ValueError", False),
                    ("AttributeError", False),
                ],
            },
            {
                "text": "What is the guaranteed behavior of the finally block in Python exception handling?",
                "points": 1,
                "options": [
                    ("It always runs regardless of whether an exception occurred, was handled, or remained unhandled.", True),
                    ("It runs only if the try block succeeded without error.", False),
                    ("It runs only if an uncaught exception occurred.", False),
                    ("It silences and hides all error messages.", False),
                ],
            },
        ],
    },
}

def seed_quizzes():
    db = SessionLocal()
    try:
        print("=== SEEDING KITSUNO QUIZ CONTENT ===")
        total_quizzes_synced = 0
        total_questions_synced = 0
        total_options_synced = 0

        for (course_title, mod_order, lesson_order), q_spec in QUIZ_DATA.items():
            # 1. Locate the course
            course = db.query(Course).filter(Course.title == course_title).first()
            if not course:
                print(f"[WARN] Course not found: '{course_title}' - skipping quiz.")
                continue

            # 2. Locate the module
            module = next((m for m in course.modules if m.order_number == mod_order), None)
            if not module:
                print(f"[WARN] Module {mod_order} not found in '{course_title}' - skipping quiz.")
                continue

            # 3. Locate the target lesson
            lesson = next((l for l in module.lessons if l.order_number == lesson_order), None)
            if not lesson:
                print(f"[WARN] Lesson {lesson_order} in Module {mod_order} of '{course_title}' not found - skipping quiz.")
                continue

            # 4. Find or create Quiz for this lesson
            quiz = db.query(Quiz).filter(Quiz.lesson_id == lesson.id).first()
            if not quiz:
                quiz = Quiz(
                    lesson_id=lesson.id,
                    title=q_spec["title"],
                    description=q_spec["description"],
                )
                db.add(quiz)
                db.commit()
                db.refresh(quiz)
                status_str = "CREATED"
            else:
                quiz.title = q_spec["title"]
                quiz.description = q_spec["description"]
                db.commit()
                db.refresh(quiz)
                status_str = "UPDATED"

            total_quizzes_synced += 1

            # 5. Sync Questions
            existing_questions = {q.order_index: q for q in quiz.questions}
            for q_idx, q_data in enumerate(q_spec["questions"], start=1):
                if q_idx in existing_questions:
                    question = existing_questions[q_idx]
                    question.question_text = q_data["text"]
                    question.points = q_data.get("points", 1)
                    question.question_type = "MULTIPLE_CHOICE"
                else:
                    question = Question(
                        quiz_id=quiz.id,
                        question_text=q_data["text"],
                        question_type="MULTIPLE_CHOICE",
                        points=q_data.get("points", 1),
                        order_index=q_idx,
                    )
                    db.add(question)
                    db.commit()
                    db.refresh(question)

                total_questions_synced += 1

                # 6. Sync Options
                existing_options = {o.order_index: o for o in question.options}
                for opt_idx, (opt_text, is_corr) in enumerate(q_data["options"], start=1):
                    if opt_idx in existing_options:
                        opt = existing_options[opt_idx]
                        opt.option_text = opt_text
                        opt.is_correct = is_corr
                    else:
                        opt = Option(
                            question_id=question.id,
                            option_text=opt_text,
                            is_correct=is_corr,
                            order_index=opt_idx,
                        )
                        db.add(opt)

                    total_options_synced += 1

                # Clean up extra options if any
                for extra_idx in range(len(q_data["options"]) + 1, len(existing_options) + 1):
                    if extra_idx in existing_options:
                        db.delete(existing_options[extra_idx])

            # Clean up extra questions if any
            for extra_q_idx in range(len(q_spec["questions"]) + 1, len(existing_questions) + 1):
                if extra_q_idx in existing_questions:
                    db.delete(existing_questions[extra_q_idx])

            db.commit()
            print(f"[{status_str}] Quiz: '{quiz.title}' on Lesson {lesson.id} ({course_title} M{mod_order}:L{lesson_order})")

        print("\n=======================================================")
        print(f"QUIZ SEEDING COMPLETE!")
        print(f"Total Quizzes Synced:   {total_quizzes_synced}")
        print(f"Total Questions Synced: {total_questions_synced}")
        print(f"Total Options Synced:   {total_options_synced}")
        print("=======================================================")

    finally:
        db.close()

if __name__ == "__main__":
    seed_quizzes()
