// ⚠️ 주의: 모든 데이터는 예시입니다. 실제 운영 시 정확한 공식 데이터로 교체해야 합니다.

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const faqs: FAQ[] = [
  {
    id: 'faq1',
    category: '재건축 기본',
    question: '재건축 진행 단계는 어떻게 되나요?',
    answer: '재건축은 일반적으로 1) 추진위원회 구성 → 2) 안전진단 → 3) 정비계획 수립 → 4) 조합설립인가 → 5) 사업시행인가 → 6) 관리처분인가 → 7) 철거 및 착공 → 8) 입주 순서로 진행됩니다. 각 단지마다 진행 속도는 다를 수 있습니다.',
    keywords: ['재건축', '단계', '진행', '절차']
  },
  {
    id: 'faq2',
    category: '비용',
    question: '시범단지 분담금은 얼마인가요?',
    answer: '현재 예상 분담금은 32평형 기준 약 2.5억원, 46평형 기준 약 4.1억원입니다. 다만, 이는 예시 수치이며 실제 분담금은 시공사 선정, 설계, 분양가 등에 따라 달라질 수 있습니다. 정확한 정보는 조합 공식 발표를 확인하시기 바랍니다.',
    keywords: ['시범단지', '분담금', '비용', '32평', '46평']
  },
  {
    id: 'faq3',
    category: '교통',
    question: '8호선 연장은 언제 완료되나요?',
    answer: '지하철 8호선 연장은 현재 계획 단계이며, 정확한 개통 시기는 미정입니다. 국토교통부 및 성남시 발표를 참고하시기 바랍니다. GTX-C 노선도 분당 지역 교통 개선에 도움이 될 것으로 예상됩니다.',
    keywords: ['8호선', '연장', '교통', 'GTX']
  },
  {
    id: 'faq4',
    category: '학군',
    question: '재건축 후 학교 과밀화는 어떻게 해결하나요?',
    answer: '학령인구 증가에 대비하여 기존 학교 증축 또는 신설 학교 건립이 검토되고 있습니다. 교육청과 지자체가 협력하여 통학구역 조정 및 학교 인프라 확충을 계획하고 있습니다. 구체적인 계획은 교육청 공식 발표를 확인하시기 바랍니다.',
    keywords: ['학교', '학군', '과밀화', '학생수']
  },
  {
    id: 'faq5',
    category: '이주',
    question: '이주비 대출은 어떻게 받나요?',
    answer: '이주비 대출은 조합을 통해 금융기관과 협약을 맺어 진행됩니다. DSR 규제 예외가 적용될 수 있으며, 대출 조건은 개인 신용도와 소득에 따라 다릅니다. 자세한 내용은 조합 또는 재건축지원센터에 문의하시기 바랍니다.',
    keywords: ['이주비', '대출', 'DSR', '금융']
  },
  {
    id: 'faq6',
    category: '주차',
    question: '재건축 후 주차 공간은 얼마나 늘어나나요?',
    answer: '대부분의 재건축 단지는 세대당 주차대수를 1.5~2.0대로 확대할 계획입니다. 예를 들어, 시범단지는 1.1대에서 2.0대로 약 82% 증가 예정입니다. 정확한 주차대수는 각 단지별 사업계획서를 확인하시기 바랍니다.',
    keywords: ['주차', '주차장', '주차대수']
  },  
];

export const searchFAQs = (query: string): FAQ[] => {
  const lowerQuery = query.toLowerCase();
  return faqs.filter(faq => 
    faq.question.toLowerCase().includes(lowerQuery) ||
    faq.answer.toLowerCase().includes(lowerQuery) ||
    faq.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
};