# -------- Core Tools --------

import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import time
import random
import re


def google_search_jobs(query: str, location: str = "", max_results: int = 10) -> list[dict]:
    """
    Use Google Custom Search API to find job postings from Vietnamese job sites

    Args:
        query: Job search terms (e.g., "backend developer java")
        location: Location preference (e.g., "TP.HCM", "Hà Nội")
        max_results: Maximum number of results to return

    Returns:
        list of job dictionaries with basic info from Google search
    """
    import os

    # Get API credentials
    api_key = os.getenv('GOOGLE_API_KEY')
    search_engine_id = os.getenv('GOOGLE_CSE_ID')

    if not api_key or not search_engine_id:
        print("Google API credentials not found, using fallback scraping")
        return []

    # Target Vietnamese job sites
    job_sites = [
        "site:topcv.vn",
        "site:vietnamworks.com",
        "site:topdev.vn",
        "site:itviec.com",
        "site:careerbuilder.vn"
    ]

    # Build comprehensive search query
    site_filter = " OR ".join(job_sites)
    full_query = f"{query}"
    if location:
        full_query += f" {location}"
    full_query += f" ({site_filter})"

    # Add Vietnamese equivalent terms
    vietnamese_terms = {
        'developer': 'lập trình viên',
        'engineer': 'kỹ sư phần mềm',
        'internship': 'thực tập sinh',
        'manager': 'trưởng nhóm',
        'backend': 'backend',
        'frontend': 'frontend',
        'fullstack': 'full-stack'
    }

    # Add Vietnamese alternatives
    vn_alternatives = []
    for en_term, vn_term in vietnamese_terms.items():
        if en_term in query.lower():
            vn_alternatives.append(vn_term)

    if vn_alternatives:
        full_query += f" OR ({' '.join(vn_alternatives)})"

    try:
        # Google Custom Search API call
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': api_key,
            'cx': search_engine_id,
            'q': full_query,
            'num': min(max_results, 10),  # API limit per request
            'lr': 'lang_vi',  # Vietnamese language
            'gl': 'vn',       # Vietnam country
            'safe': 'active'
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        jobs = []
        for item in data.get('items', []):
            # Extract job info from Google results
            title = item.get('title', '')
            snippet = item.get('snippet', '')
            url = item.get('link', '')

            # Parse company and other details from snippet and title
            company = extract_company_from_google_result(title, snippet)
            salary = extract_salary_from_snippet(snippet)
            job_location = location if location else extract_location_from_snippet(
                snippet)
            source = extract_source_from_url(url)

            jobs.append({
                'title': clean_job_title(title),
                'company': company,
                'location': job_location,
                'salary': salary,
                'url': url,
                'source': source,
                'snippet': snippet[:200] + "..." if len(snippet) > 200 else snippet
            })

        return jobs

    except requests.exceptions.RequestException as e:
        print(f"Google API request error: {e}")
        return []
    except Exception as e:
        print(f"Google search error: {e}")
        return []


def web_scrape_jobs(query: str, location: str = "", pages: int = 1) -> list[dict]:
    """
    Enhanced web scraping for job sites with better reliability

    Args:
        query: Search query
        location: Location filter
        pages: Number of pages to scrape

    Returns:
        list of detailed job dictionaries
    """

    def scrape_topcv(query: str, location: str, page: int) -> list[dict]:
        """Scrape TopCV with improved selectors"""
        try:
            url = f"https://www.topcv.vn/viec-lam?q={quote_plus(query)}"
            if location:
                url += f"&l={quote_plus(location)}"
            url += f"&page={page}"

            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache"
            }

            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            jobs = []

            # Multiple selector strategies for robustness
            job_selectors = [
                "[data-cy='job-card']",
                ".job-item",
                ".job-list-search-result .job-item",
                ".search-result .job-item"
            ]

            for selector in job_selectors:
                cards = soup.select(selector)
                if cards:
                    break

            for card in cards:
                # Try multiple title selectors
                title_el = None
                title_selectors = ["a[href*='/viec-lam/']",
                                   ".title a", "h3 a", ".job-title a"]
                for sel in title_selectors:
                    title_el = card.select_one(sel)
                    if title_el:
                        break

                if not title_el:
                    continue

                # Extract other info with fallbacks
                company_el = card.select_one(
                    ".company, .job-company, [data-cy='company-name'], .company-name")
                loc_el = card.select_one(
                    ".address, .location, [data-cy='job-location'], .job-location")
                salary_el = card.select_one(
                    ".salary, [data-cy='job-salary'], .job-salary")

                url = title_el.get("href", "")
                if url and url.startswith("/"):
                    url = "https://www.topcv.vn" + url

                jobs.append({
                    'title': title_el.get_text(strip=True),
                    'company': company_el.get_text(strip=True) if company_el else "",
                    'location': loc_el.get_text(strip=True) if loc_el else location,
                    'salary': salary_el.get_text(strip=True) if salary_el else "Thỏa thuận",
                    'url': url,
                    'source': 'topcv'
                })

            return jobs

        except Exception as e:
            print(f"Error scraping TopCV: {e}")
            return []

    def scrape_vietnamworks(query: str, location: str, page: int) -> list[dict]:
        """Scrape VietnamWorks with enhanced error handling"""
        try:
            # Similar implementation with multiple selector fallbacks
            # and better error handling
            pass
        except Exception as e:
            print(f"Error scraping VietnamWorks: {e}")
            return []

    def scrape_topdev(query: str, location: str, page: int) -> list[dict]:
        """Scrape TopDev for tech jobs"""
        try:
            # Implementation for TopDev
            pass
        except Exception as e:
            print(f"Error scraping TopDev: {e}")
            return []

    # Execute scraping across sites
    all_jobs = []
    scrapers = [scrape_topcv, scrape_vietnamworks, scrape_topdev]

    for scraper in scrapers:
        for page in range(1, pages + 1):
            try:
                jobs = scraper(query, location, page)
                all_jobs.extend(jobs)
                time.sleep(random.uniform(1, 2))  # Rate limiting
            except Exception as e:
                print(f"Scraper error: {e}")
                continue

    # Remove duplicates
    seen_urls = set()
    unique_jobs = []
    for job in all_jobs:
        if job['url'] not in seen_urls:
            seen_urls.add(job['url'])
            unique_jobs.append(job)

    return unique_jobs


def optimize_search_query(user_request: str, user_profile: dict) -> list[str]:
    """
    Generate optimized search queries from user input

    Args:
        user_request: Original user request
        user_profile: User profile with skills, experience, etc.

    Returns:
        list of optimized search queries
    """
    base_queries = []

    # Extract key terms from user request
    skills = user_profile.get('skills', [])
    experience_level = user_profile.get('experience_years', 0)

    # Generate base query variations
    if 'backend' in user_request.lower():
        base_queries.extend([
            "backend developer",
            "backend engineer",
            "server side developer"
        ])

    if 'frontend' in user_request.lower():
        base_queries.extend([
            "frontend developer",
            "frontend engineer",
            "web developer"
        ])

    # Add skill-specific queries
    for skill in skills[:3]:  # Top 3 skills
        base_queries.append(f"{skill} developer")
        if experience_level <= 1:
            base_queries.append(f"{skill} junior")
            base_queries.append(f"{skill} intern")
        elif experience_level <= 3:
            base_queries.append(f"{skill} junior developer")
        else:
            base_queries.append(f"senior {skill}")

    # Add experience level qualifiers
    if experience_level <= 1:
        base_queries.extend([
            query + " junior" for query in base_queries[:3]
        ])
        base_queries.extend([
            query + " fresher" for query in base_queries[:3]
        ])

    # Remove duplicates and limit
    unique_queries = list(dict.fromkeys(base_queries))
    return unique_queries[:5]  # Top 5 queries


def merge_and_deduplicate_jobs(google_jobs: list[dict], scraped_jobs: list[dict]) -> list[dict]:
    """
    Merge results from Google search and scraping, remove duplicates

    Args:
        google_jobs: Jobs found via Google search
        scraped_jobs: Jobs found via web scraping

    Returns:
        Merged and deduplicated job list
    """
    all_jobs = []
    seen_urls = set()
    seen_titles_companies = set()

    # Add all jobs while checking for duplicates
    for job_list in [google_jobs, scraped_jobs]:
        for job in job_list:
            url = job.get('url', '')
            title = job.get('title', '').lower().strip()
            company = job.get('company', '').lower().strip()

            # Skip if duplicate URL
            if url and url in seen_urls:
                continue

            # Skip if same title + company (likely duplicate)
            title_company_key = f"{title}|{company}"
            if title_company_key in seen_titles_companies:
                continue

            # Add to results
            if url:
                seen_urls.add(url)
            seen_titles_companies.add(title_company_key)
            all_jobs.append(job)

    return all_jobs


def analyze_and_score_jobs(jobs: list[dict], user_profile: dict) -> list[dict]:
    """
    Analyze and score jobs based on user profile

    Args:
        jobs: list of job dictionaries
        user_profile: User profile with preferences

    Returns:
        list of jobs with scores and reasoning
    """
    scored_jobs = []

    user_skills = [skill.lower() for skill in user_profile.get('skills', [])]
    user_location = user_profile.get('location', '').lower()
    user_experience = user_profile.get('experience_years', 0)
    expected_salary = user_profile.get('expected_salary', 0)

    for job in jobs:
        score = 0
        reasons = []

        title = job.get('title', '').lower()
        company = job.get('company', '').lower()
        location = job.get('location', '').lower()
        salary = job.get('salary', '').lower()

        # Skill matching (highest weight)
        skill_matches = 0
        for skill in user_skills:
            if skill in title or skill in job.get('snippet', '').lower():
                score += 5
                skill_matches += 1
                reasons.append(f"Khớp skill {skill.title()}")

        # Bonus for multiple skill matches
        if skill_matches >= 2:
            score += 3
            reasons.append("Khớp nhiều skills quan trọng")

        # Experience level matching
        if user_experience <= 1:
            if any(term in title for term in ['junior', 'fresher', 'intern', 'trainee']):
                score += 4
                reasons.append("Phù hợp level fresher/junior")
        elif 1 < user_experience <= 3:
            if 'junior' in title and 'senior' not in title:
                score += 4
                reasons.append("Phù hợp level junior")
        else:
            if any(term in title for term in ['senior', 'lead', 'principal']):
                score += 4
                reasons.append("Phù hợp level senior")

        # Location matching
        if user_location and user_location in location:
            score += 3
            reasons.append("Đúng khu vực mong muốn")

        # Remote work bonus
        if any(term in (title + location) for term in ['remote', 'work from home', 'wfh']):
            score += 2
            reasons.append("Hỗ trợ làm việc remote")

        # Salary analysis (basic)
        if expected_salary > 0 and salary and salary != 'thỏa thuận':
            # Simple salary extraction
            salary_numbers = [int(x) for x in salary.split() if x.isdigit()]
            # Convert to millions
            if salary_numbers and max(salary_numbers) >= expected_salary/1000000:
                score += 2
                reasons.append("Đáp ứng mức lương mong đợi")

        # Company reputation (basic check)
        reputable_keywords = ['tech', 'technology',
                              'software', 'digital', 'innovation']
        if any(keyword in company for keyword in reputable_keywords):
            score += 1
            reasons.append("Công ty công nghệ uy tín")

        scored_jobs.append({
            'job': job,
            'score': score,
            'reasons': reasons,
            'match_percentage': min(100, (score / 25) * 100)
        })

    # Sort by score
    scored_jobs.sort(key=lambda x: x['score'], reverse=True)
    return scored_jobs


def format_job_results(scored_jobs: list[dict], search_summary: dict) -> str:
    """
    Format final job recommendations in Vietnamese-friendly markdown

    Args:
        scored_jobs: Jobs with scores and reasons
        search_summary: Summary of search process

    Returns:
        Formatted markdown string
    """
    if not scored_jobs:
        return "# ❌ Không tìm thấy việc làm phù hợp\n\nVui lòng thử với từ khóa khác hoặc mở rộng khu vực tìm kiếm."

    result = "# 🎯 Kết quả Tìm kiếm Việc làm\n\n"

    # Search summary
    result += "## 📊 Tổng quan\n"
    result += f"- **Tổng số việc làm:** {search_summary.get('total_found', 0) or 0}\n"
    sources_used = search_summary.get('sources_used', []) or []
    result += f"- **Nguồn tìm kiếm:** {', '.join(sources_used) if sources_used else 'N/A'}\n"
    result += f"- **Từ khóa:** {search_summary.get('queries_used') or 'N/A'}\n"
    result += f"- **Khu vực:** {search_summary.get('location') or 'Toàn quốc'}\n\n"

    # Top recommendations
    result += "## 🏆 Top Gợi ý Phù hợp Nhất\n\n"

    top_jobs = scored_jobs[:5]  # Top 5

    for i, job_data in enumerate(top_jobs, 1):
        job = job_data['job']
        score = job_data['score']
        reasons = job_data['reasons']
        match_pct = job_data['match_percentage']

        # Job header with match percentage
        job_title = job.get('title') or 'N/A'
        result += f"### {i}. {job_title} "

        # Match indicator
        if match_pct >= 80:
            result += "🔥 **KHỚP HOÀN HẢO**"
        elif match_pct >= 60:
            result += "⭐ **PHỪ HỢP**"
        elif match_pct >= 40:
            result += "✅ **CÓ THỂ XEM XÉT**"
        else:
            result += "📝 **THAM KHẢO**"

        result += f" ({match_pct:.0f}%)\n\n"

        # Job details table
        result += "| Thông tin | Chi tiết |\n"
        result += "|-----------|----------|\n"
        result += f"| 🏢 **Công ty** | {job.get('company', 'N/A') or 'N/A'} |\n"
        result += f"| 📍 **Địa điểm** | {job.get('location', 'N/A') or 'N/A'} |\n"
        result += f"| 💰 **Mức lương** | {job.get('salary', 'Thỏa thuận') or 'Thỏa thuận'} |\n"
        result += f"| 🌐 **Nguồn** | {(job.get('source') or 'N/A').title()} |\n\n"

        # Why it matches
        if reasons:
            result += "**🎯 Lý do phù hợp:**\n"
            for reason in reasons:
                result += f"- {reason}\n"
            result += "\n"

        # Action button
        job_url = job.get('url') or '#'
        result += f"**👉 [Xem chi tiết & Ứng tuyển]({job_url})**\n\n"
        result += "---\n\n"

    # Additional suggestions if low scores
    if top_jobs and top_jobs[0]['match_percentage'] < 60:
        result += "## 💡 Gợi ý Cải thiện Tìm kiếm\n\n"
        result += "- Thử mở rộng khu vực tìm kiếm\n"
        result += "- Xem xét các vị trí junior/trainee nếu bạn mới bắt đầu\n"
        result += "- Cập nhật thêm skills trong profile\n"
        result += "- Thử các từ khóa tương tự (VD: 'lập trình viên' thay vì 'developer')\n\n"

    # General application tips
    result += "## 🚀 Tips Ứng tuyển Thành công\n\n"
    result += "1. **Tùy chỉnh CV** cho từng vị trí - highlight skills phù hợp\n"
    result += "2. **Research công ty** trước khi apply\n"
    result += "3. **Viết cover letter** ngắn gọn, tập trung vào value bạn mang lại\n"
    result += "4. **Follow up** sau 3-5 ngày nếu chưa có phản hồi\n"
    result += "5. **Chuẩn bị câu hỏi** để hỏi interviewer\n\n"

    return result


def extract_user_requirements(user_input: str) -> dict:
    """
    Extract job requirements from natural language input

    Args:
        user_input: User's job search request

    Returns:
        Structured requirements dictionary
    """
    requirements = {
        'query_terms': [],
        'skills': [],
        'experience_keywords': [],
        'location_hints': [],
        'job_type': 'full-time'
    }

    # Common Vietnamese location names
    vn_locations = {
        'hồ chí minh': 'TP.HCM', 'ho chi minh': 'TP.HCM', 'saigon': 'TP.HCM',
        'hà nội': 'Hà Nội', 'hanoi': 'Hà Nội',
        'đà nẵng': 'Đà Nẵng', 'da nang': 'Đà Nẵng'
    }

    # Extract locations
    for location_key, standard_name in vn_locations.items():
        if location_key in user_input.lower():
            requirements['location_hints'].append(standard_name)

    # Extract experience level
    if any(term in user_input.lower() for term in ['intern', 'thực tập', 'fresher']):
        requirements['experience_keywords'].append('intern')
    elif any(term in user_input.lower() for term in ['junior', 'mới ra trường']):
        requirements['experience_keywords'].append('junior')
    elif any(term in user_input.lower() for term in ['senior', 'kinh nghiệm']):
        requirements['experience_keywords'].append('senior')

    # Extract job type
    if any(term in user_input.lower() for term in ['part-time', 'bán thời gian']):
        requirements['job_type'] = 'part-time'
    elif any(term in user_input.lower() for term in ['internship', 'thực tập']):
        requirements['job_type'] = 'internship'

    # Extract technical skills
    tech_skills = ['java', 'python', 'javascript', 'react', 'vue', 'angular',
                   'node.js', 'spring', 'spring boot', 'mysql', 'postgresql']

    for skill in tech_skills:
        if skill in user_input.lower():
            requirements['skills'].append(skill)

    return requirements

# -------- Helper Functions for Google Search --------


def extract_company_from_google_result(title: str, snippet: str) -> str:
    """Extract company name from Google search result"""
    # Look for company indicators in title
    title_parts = title.split(' - ')
    if len(title_parts) >= 2:
        # Usually format: "Job Title - Company Name"
        return title_parts[-1].strip()

    # Look in snippet for company indicators
    company_indicators = ['công ty', 'company', 'tại ', 'làm việc tại']
    for indicator in company_indicators:
        if indicator in snippet.lower():
            # Extract text after indicator
            parts = snippet.lower().split(indicator)
            if len(parts) > 1:
                potential_company = parts[1].split(
                    '.')[0].split(',')[0].strip()
                if len(potential_company) < 50:  # Reasonable company name length
                    return potential_company.title()

    return "N/A"


def extract_salary_from_snippet(snippet: str) -> str:
    """Extract salary from snippet text"""
    import re

    # Vietnamese salary patterns
    salary_patterns = [
        r'(\d+)-(\d+)\s*(triệu|tr|million)',  # 15-25 triệu
        r'(\d+)\s*(triệu|tr|million)',         # 20 triệu
        r'(\d+,?\d*)\s*-\s*(\d+,?\d*)\s*VND',  # 15,000,000 - 25,000,000 VND
        r'lương:\s*([^.]+)',                   # lương: 15-25 triệu
        r'salary:\s*([^.]+)'                   # salary: $1000-2000
    ]

    for pattern in salary_patterns:
        match = re.search(pattern, snippet.lower())
        if match:
            return match.group(0).strip()

    # Look for "thỏa thuận" or negotiable
    if any(term in snippet.lower() for term in ['thỏa thuận', 'negotiable', 'cạnh tranh']):
        return "Thỏa thuận"

    return "N/A"


def extract_location_from_snippet(snippet: str) -> str:
    """Extract location from snippet if not provided"""
    vn_locations = ['tp.hcm', 'hồ chí minh',
                    'hà nội', 'đà nẵng', 'cần thơ', 'hải phòng']

    snippet_lower = snippet.lower()
    for location in vn_locations:
        if location in snippet_lower:
            return location.title()

    return "N/A"


def extract_source_from_url(url: str) -> str:
    """Extract source site from URL"""
    if 'topcv.vn' in url:
        return 'topcv'
    elif 'vietnamworks.com' in url:
        return 'vietnamworks'
    elif 'topdev.vn' in url:
        return 'topdev'


def clean_job_title(title: str) -> str:
    """Clean job title from Google results"""
    # Remove site names and extra info
    title = re.sub(r'\s*-\s*(TopCV|VietnamWorks|TopDev|ITviec|CareerBuilder).*',
                   '', title, flags=re.IGNORECASE)
    return title.strip()
