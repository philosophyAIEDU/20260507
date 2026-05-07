import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Printer, 
  Copy, 
  Download, 
  ChevronRight, 
  School, 
  Calendar, 
  Users, 
  MessageSquare,
  RefreshCw,
  Layout,
  Type as FontIcon,
  Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateLetterContent, LetterContent } from './lib/geminiService';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolName: '',
    target: '학부모님 귀하',
    topic: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    sender: '학교장',
  });

  const [generatedData, setGeneratedData] = useState<LetterContent | null>(null);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleGenerate = async () => {
    if (!formData.topic) return;
    setLoading(true);
    try {
      const result = await generateLetterContent(
        formData.topic,
        formData.schoolName,
        formData.target,
        formData.notes
      );
      setGeneratedData(result);
      setStep(2);
    } catch (error) {
      alert('생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedData) return;
    const text = `
${generatedData.title}

${generatedData.body}

[안내사항]
${generatedData.announcements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${formData.date}
${formData.schoolName} ${formData.sender}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setPdfGenerating(true);
    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // Higher quality for printing
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // A4 is 210 x 297 mm
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${formData.schoolName || '가정통신문'}_${generatedData?.title || '문서'}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF 저장 중 오류가 발생했습니다.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2D2D] font-sans selection:bg-[#E2D1C3]">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-[#E5E5E5] z-50 px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#8B7E74] rounded-lg flex items-center justify-center text-white">
            <School size={20} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">가정통신문 제작기</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(1)}
            className={`text-sm font-medium transition-colors ${step === 1 ? 'text-[#8B7E74]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            정보 입력
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <button 
            disabled={!generatedData}
            onClick={() => setStep(2)}
            className={`text-sm font-medium transition-colors ${step === 2 ? 'text-[#8B7E74]' : 'text-gray-400 hover:text-gray-600 disabled:opacity-50'}`}
          >
            문서 미리보기
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left: Input Form */}
        <section className={`print:hidden ${step === 2 ? 'hidden lg:block' : 'block'}`}>
          <div className="space-y-8">
            <header>
              <h2 className="text-3xl font-serif italic text-[#4A443F] mb-2">Create Announcement</h2>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">필수 정보를 입력하고 AI의 도움을 받으세요</p>
            </header>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center gap-2">
                  <School size={12} /> 학교 이름
                </label>
                <input 
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  placeholder="예: 서울OO초등학교"
                  className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E2D1C3] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center gap-2">
                    <Users size={12} /> 수신 대상
                  </label>
                  <input 
                    type="text"
                    name="target"
                    value={formData.target}
                    onChange={handleInputChange}
                    placeholder="예: 학부모님"
                    className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E2D1C3] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center gap-2">
                    <Calendar size={12} /> 발송 일자
                  </label>
                  <input 
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E2D1C3] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center gap-2">
                  <MessageSquare size={12} /> 주제 및 목적
                </label>
                <textarea 
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="무엇에 관한 안내인가요? (예: 현장체험학습 안내)"
                  className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E2D1C3] outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center gap-2">
                  <Layout size={12} /> 추가 전달 사항
                </label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="꼭 포함해야 할 내용이나 조건을 적어주세요. (예: 준비물, 집합 시간 등)"
                  className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E2D1C3] outline-none resize-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !formData.topic}
                className="w-full group relative bg-[#8B7E74] hover:bg-[#6D6158] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                  )}
                  {loading ? 'AI가 초안을 작성 중...' : 'AI로 내용 생성하기'}
                </div>
                <motion.div 
                  className="absolute inset-0 bg-[#A6998F]"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Right: Preview Pane */}
        <section className={`transition-all duration-500 ${step === 2 ? 'col-span-1 block' : 'hidden lg:block opacity-40 grayscale pointer-events-none'}`}>
          <div className="sticky top-24 space-y-6 print:static print:pt-0">
            <div className="flex justify-between items-end print:hidden">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#8B7E74]">Document Preview</h3>
                <p className="text-xs text-gray-400">규격에 맞춰 자동 정렬된 모습입니다</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] hover:bg-gray-50 transition-colors text-gray-600 relative group"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">텍스트 복사</span>
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={pdfGenerating}
                  className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] hover:bg-gray-50 transition-colors text-[#8B7E74] relative group disabled:opacity-50"
                >
                  {pdfGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">PDF 저장</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] hover:bg-gray-50 transition-colors text-[#8B7E74] relative group"
                >
                  <Printer size={18} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">인쇄</span>
                </button>
              </div>
            </div>

            {/* The Document */}
            <AnimatePresence mode="wait">
              <motion.div 
                ref={previewRef}
                key={generatedData?.title || 'empty'}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white shadow-2xl shadow-[#E2D1C3]/20 border border-[#E5E5E5] aspect-[1/1.414] w-full p-12 flex flex-col items-center print:shadow-none print:border-none print:w-[210mm] print:h-[297mm] print:p-16 mx-auto overflow-hidden"
              >
                <div className="w-full flex-1 flex flex-col justify-between">
                  {/* Header Decoration */}
                  <div className="border-b-4 border-double border-[#8B7E74] pb-4 mb-10 w-full flex justify-between items-end">
                    <div className="text-xl font-bold tracking-tighter text-[#4A443F]">가 정 통 신 문</div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-mono italic">Document No. 2026-EDU-{Math.floor(Math.random() * 9000) + 1000}</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-12">
                    <h2 className="text-[28px] font-bold tracking-tight text-[#2D2D2D] break-keep leading-tight px-4">
                      {generatedData?.title || '(제목이 여기에 표시됩니다)'}
                    </h2>
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 space-y-10 leading-relaxed text-[#444] text-[15px]">
                    <p className="whitespace-pre-wrap">
                      {generatedData?.body || '주제를 입력하고 생성을 누르면 품격 있는 본문이 이곳에 자리하게 됩니다.'}
                    </p>

                    {generatedData?.announcements && generatedData.announcements.length > 0 && (
                      <div className="bg-[#FAF9F8] p-8 rounded-2xl space-y-4 border border-[#F0EFEF]">
                        <h4 className="text-xs uppercase tracking-widest font-bold text-[#8B7E74]">안내 사항</h4>
                        <ul className="space-y-3">
                          {generatedData.announcements.map((item, idx) => (
                            <li key={idx} className="flex gap-4 items-start">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[10px] font-bold text-[#8B7E74]">
                                {idx + 1}
                              </span>
                              <span className="pt-0.5">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-16 pt-12 border-t border-[#F0EFEF] text-center space-y-6">
                    <div className="text-gray-500 font-medium tracking-widest text-sm">
                      {new Date(formData.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-2xl font-bold tracking-[0.2em] text-[#4A443F]">
                        {formData.schoolName || 'OOO학교'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-[0.5em]">{formData.sender || '학교장'}</span>
                        <div className="w-10 h-10 border-2 border-red-200 rounded-full flex items-center justify-center text-red-500/30 font-serif italic text-xs rotate-[-15deg]">
                          (직인)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Floating Action for Mobile */}
      <div className="fixed bottom-8 right-8 lg:hidden print:hidden">
        <button 
          onClick={() => setStep(step === 1 ? 2 : 1)}
          className="w-14 h-14 bg-[#8B7E74] rounded-full shadow-lg flex items-center justify-center text-white"
        >
          {step === 1 ? <FileText size={24} /> : <Layout size={24} />}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          main { display: block !important; padding: 0 !important; }
          .min-h-screen { min-height: 0 !important; }
        }
      `}} />
    </div>
  );
}

