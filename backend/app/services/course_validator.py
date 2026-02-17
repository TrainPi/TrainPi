#!/usr/bin/env python3
"""
Course Quality Validation Module
Ensures all AI-generated courses meet high standards
"""
import re
from typing import Dict, List, Tuple

class CourseValidator:
    """Validates the quality of AI-generated learning courses"""
    
    MIN_STEPS = 7
    MAX_STEPS = 12
    MIN_RESOURCES_PER_STEP = 2
    MIN_SKILLS_PER_STEP = 2
    MIN_KEY_SKILLS = 3
    
    @staticmethod
    def validate_course(course_data: Dict) -> Tuple[bool, List[str]]:
        """
        Validate a course and return (is_valid, list_of_issues)
        """
        issues = []
        
        # 1. Check basic structure
        required_fields = ['steps', 'estimated_timeline', 'key_skills', 'next_action']
        for field in required_fields:
            if field not in course_data:
                issues.append(f"❌ Missing required field: {field}")
            elif not course_data[field]:
                issues.append(f"❌ Empty required field: {field}")
        
        if not isinstance(course_data.get('steps'), list):
            issues.append(f"❌ 'steps' must be a list, got {type(course_data.get('steps'))}")
            return False, issues
        
        steps = course_data['steps']
        
        # 2. Validate number of steps
        if len(steps) < CourseValidator.MIN_STEPS:
            issues.append(f"❌ Too few steps ({len(steps)}) - minimum is {CourseValidator.MIN_STEPS}")
        elif len(steps) > CourseValidator.MAX_STEPS:
            issues.append(f"⚠️ Too many steps ({len(steps)}) - maximum recommended is {CourseValidator.MAX_STEPS}")
        
        # 3. Validate each step
        for i, step in enumerate(steps, 1):
            step_issues = CourseValidator._validate_step(step, i)
            issues.extend(step_issues)
        
        # 4. Validate progression
        progression_issues = CourseValidator._validate_progression(steps)
        issues.extend(progression_issues)
        
        # 5. Validate key skills
        key_skills = course_data.get('key_skills', [])
        if not isinstance(key_skills, list):
            issues.append(f"❌ 'key_skills' must be a list")
        elif len(key_skills) < CourseValidator.MIN_KEY_SKILLS:
            issues.append(f"❌ Too few key skills ({len(key_skills)}) - minimum is {CourseValidator.MIN_KEY_SKILLS}")
        
        # 6. Validate timeline format
        timeline = course_data.get('estimated_timeline', '')
        if not CourseValidator._is_valid_timeline(timeline):
            issues.append(f"⚠️ Timeline format unclear: '{timeline}' - should specify duration (e.g., '6-12 months')")
        
        # 7. Validate next action
        next_action = course_data.get('next_action', '')
        if len(next_action) < 20:
            issues.append(f"❌ 'next_action' too vague - should be specific and actionable")
        
        # Determine if course is valid
        critical_issues = [i for i in issues if i.startswith('❌')]
        is_valid = len(critical_issues) == 0
        
        return is_valid, issues
    
    @staticmethod
    def _validate_step(step: Dict, step_number: int) -> List[str]:
        """Validate a single step"""
        issues = []
        
        # Check required fields
        required = ['title', 'description', 'skills', 'estimated_time', 'resources']
        for field in required:
            if field not in step:
                issues.append(f"❌ Step {step_number}: Missing field '{field}'")
            elif not step[field]:
                issues.append(f"❌ Step {step_number}: Empty field '{field}'")
        
        # Validate title
        title = step.get('title', '')
        if len(title) < 5:
            issues.append(f"❌ Step {step_number}: Title too short")
        
        # Validate description
        description = step.get('description', '')
        if len(description) < 50:
            issues.append(f"⚠️ Step {step_number}: Description too brief (< 50 chars)")
        
        # Validate skills
        skills = step.get('skills', [])
        if not isinstance(skills, list):
            issues.append(f"❌ Step {step_number}: 'skills' must be a list")
        elif len(skills) < CourseValidator.MIN_SKILLS_PER_STEP:
            issues.append(f"⚠️ Step {step_number}: Too few skills ({len(skills)}) - minimum is {CourseValidator.MIN_SKILLS_PER_STEP}")
        
        # Validate resources
        resources = step.get('resources', [])
        if not isinstance(resources, list):
            issues.append(f"❌ Step {step_number}: 'resources' must be a list")
        elif len(resources) < CourseValidator.MIN_RESOURCES_PER_STEP:
            issues.append(f"❌ Step {step_number}: Too few resources ({len(resources)}) - minimum is {CourseValidator.MIN_RESOURCES_PER_STEP}")
        else:
            for j, resource in enumerate(resources, 1):
                if not isinstance(resource, dict):
                    issues.append(f"❌ Step {step_number}: Resource {j} must be a dict")
                    continue
                if 'name' not in resource or not resource['name']:
                    issues.append(f"❌ Step {step_number}: Resource {j} missing 'name'")
                if 'url' not in resource or not resource['url']:
                    # Convert missing URL to a search link instead of marking as error
                    resource['url'] = f"https://www.google.com/search?q={resource.get('name', 'resource').replace(' ', '+')}"
        
        # Validate estimated time
        estimated_time = step.get('estimated_time', '')
        if not CourseValidator._is_valid_time_estimate(estimated_time):
            issues.append(f"⚠️ Step {step_number}: Time estimate unclear: '{estimated_time}'")
        
        return issues
    
    @staticmethod
    def _validate_progression(steps: List[Dict]) -> List[str]:
        """Validate that courses progress logically"""
        issues = []
        
        if len(steps) < 2:
            return issues
        
        # Check that step numbers are in order
        for i, step in enumerate(steps, 1):
            if step.get('step_number') != i:
                issues.append(f"⚠️ Step numbering issue: Step {i} has number {step.get('step_number')}")
        
        # Check that skills progress in complexity
        all_skills = []
        for step in steps:
            step_skills = step.get('skills', [])
            all_skills.extend(step_skills)
        
        # Warn if there's too much repetition (more than 50% duplication)
        if len(all_skills) > 0:
            unique_skills = len(set(all_skills))
            duplication_rate = 1 - (unique_skills / len(all_skills))
            if duplication_rate > 0.5:
                issues.append(f"⚠️ Step skills are too repetitive ({duplication_rate*100:.0f}% duplication)")
        
        return issues
    
    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """Check if URL looks valid"""
        if not url or len(url) < 10:
            return False
        
        # Should start with http(s)://, www., or be a specific platform name followed by search link
        return bool(re.match(r'https?://', url)) or \
               bool(re.match(r'www\.', url)) or \
               'github' in url.lower() or \
               'search' in url.lower() or \
               'coursera' in url.lower() or \
               'udemy' in url.lower()
    
    @staticmethod
    def _is_valid_time_estimate(time_str: str) -> bool:
        """Check if time estimate is reasonable"""
        if not time_str or len(time_str) < 3:
            return False
        
        # Should contain time unit (week, weeks, month, months, day, days, hour, hours)
        time_units = ['week', 'month', 'day', 'hour', 'year']
        return any(unit in time_str.lower() for unit in time_units)
    
    @staticmethod
    def _is_valid_timeline(timeline: str) -> bool:
        """Check if overall timeline is reasonable"""
        if not timeline or len(timeline) < 3:
            return False
        
        # Should contain time units
        time_units = ['week', 'month', 'day', 'hour', 'year']
        return any(unit in timeline.lower() for unit in time_units)
    
    @staticmethod
    def get_quality_score(course_data: Dict) -> Tuple[int, List[str]]:
        """
        Calculate quality score (0-100) and get improvement suggestions
        """
        is_valid, issues = CourseValidator.validate_course(course_data)
        
        # Start with 100 points
        score = 100
        suggestions = []
        
        # Deduct for critical issues
        critical_issues = [i for i in issues if i.startswith('❌')]
        score -= len(critical_issues) * 15
        if critical_issues:
            suggestions.append("Fix critical issues (marked with ❌)")
        
        # Deduct for warnings
        warnings = [i for i in issues if i.startswith('⚠️')]
        score -= len(warnings) * 5
        if warnings:
            suggestions.append("Address warnings to improve quality")
        
        # Additional quality checks
        steps = course_data.get('steps', [])
        if len(steps) < 8:
            score -= 5
            suggestions.append("Consider adding more detailed steps for better coverage")
        
        total_resources = sum(len(s.get('resources', [])) for s in steps)
        if total_resources < len(steps) * 3:
            score -= 10
            suggestions.append("Add more high-quality resources for each step")
        
        # Ensure score is 0-100
        score = max(0, min(100, score))
        
        return score, suggestions


# Example usage
if __name__ == "__main__":
    from app.services.ai_service import get_gemini_json_response
    
    # Test with a real course
    prompt = """Generate a learning roadmap for "become a Python developer" with the JSON schema including all fields."""
    course = get_gemini_json_response(prompt)
    
    is_valid, issues = CourseValidator.validate_course(course)
    score, suggestions = CourseValidator.get_quality_score(course)
    
    print(f"Valid: {is_valid}")
    print(f"Quality Score: {score}/100")
    print(f"\nIssues:")
    for issue in issues:
        print(f"  {issue}")
    
    print(f"\nSuggestions:")
    for suggestion in suggestions:
        print(f"  • {suggestion}")
