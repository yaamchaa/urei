import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import { Helmet } from "react-helmet-async";
import { TrendingUp, Home, Currency, MapPin, Car, ArrowLeft, Building2, Layers, Calendar, Info, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { allComplexes, getComplexById, getCategoryName } from "../data/complexes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useProgress } from "../contexts/ProgressContext";
import { useTimeline } from "../contexts/TimelineContext";
import { useContribution } from "../contexts/ContributionContext";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useComplexList } from "../hooks/useComplexList";

export function DashboardPage() {
  const location = useLocation();
  const { progressData } = useProgress();
  const { getTimeline } = useTimeline();
  const { contributionData: contributionFromContext } = useContribution();
  const { id } = useParams<{ id: string }>();
  
  // URL 경로에서 카테고리 추출
  const getCategoryFromPath = () => {
    const path = location.pathname;
    if (path.includes('old-town-reconstruction')) return 'oldtown-reconstruction';
    if (path.includes('old-town-redevelopment')) return 'oldtown-redevelopment';
    if (path.includes('street-housing')) return 'garohousing';
    return 'bundang';
  };
  
  const category = getCategoryFromPath();
  const categoryName = getCategoryName(category);
  const { complexList: filteredComplexes, isLoading: isLoadingComplexes } = useComplexList(category);

  // URL 파라미터가 있으면 해당 단지를, 없으면 첫 번째 단지를 선택
  const initialComplexId = id || filteredComplexes[0]?.id;
  const [selectedComplex, setSelectedComplex] = useState(initialComplexId);
  
  // Dialog 상태
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [householdsDialogOpen, setHouseholdsDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);
  const [specialDistrictDialogOpen, setSpecialDistrictDialogOpen] = useState(false);
  
  // 서버에서 로드한 데이터 상태
  const [schoolInfo, setSchoolInfo] = useState<any[]>([]);
  const [transportInfo, setTransportInfo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [studentProjection, setStudentProjection] = useState<string>("");
  const [transportImprovementNote, setTransportImprovementNote] = useState<string>("");
  const [buildingCoverageRatio, setBuildingCoverageRatio] = useState<string>("-");
  const [floorAreaRatio, setFloorAreaRatio] = useState<string>("");
  const [parkingBefore, setParkingBefore] = useState<string>("");
  const [parkingAfter, setParkingAfter] = useState<string>("");
  const [maxFloors, setMaxFloors] = useState<string>("");
  const [subDistricts, setSubDistricts] = useState<any[]>([]);
  const [serverTotalHouseholdsBefore, setServerTotalHouseholdsBefore] = useState<string>("");
  const [serverTotalHouseholdsAfter, setServerTotalHouseholdsAfter] = useState<string>("");
  const [contributionGuide, setContributionGuide] = useState<any>(null);
  const [isLoadingExtraData, setIsLoadingExtraData] = useState(false);

  // 진행율 상세 정보 상태 (서버에서 로드)
  const [serverDetailedProgress, setServerDetailedProgress] = useState<any>(null);
  const [serverTimeline, setServerTimeline] = useState<any[]>([]);

  // 배너 내용 상태 (서버에서 로드)
  const [bannerContent, setBannerContent] = useState<any>(null);

  // 이미지 상태
  const [complexImages, setComplexImages] = useState<{
    aerial?: string;
    layout?: string;
    district?: string;
  }>({});

  // 페이지 로드 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 배너 내용 로드
  useEffect(() => {
    const loadBannerContent = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/banner-content`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setBannerContent(data.content);
        }
      } catch (error) {
        console.error("배너 내용 로드 오류:", error);
      }
    };

    loadBannerContent();
  }, []);

  // URL 파라미터가 변경되면 선택된 단지 업데이트
  useEffect(() => {
    if (id) {
      setSelectedComplex(id);
    }
  }, [id]);

  // 단지 목록이 바뀌면 첫 번째 단지를 기본 선택
  useEffect(() => {
    if (!filteredComplexes.length) return;

    const exists = filteredComplexes.some((complex) => complex.id === selectedComplex);

    if (!selectedComplex || !exists) {
      setSelectedComplex(filteredComplexes[0].id);
    }
  }, [filteredComplexes, selectedComplex]);

  // 이미지 로드
  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/images/${selectedComplex}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setComplexImages({
            aerial: data.images?.aerial || undefined,
            layout: data.images?.layout || undefined,
            district: data.images?.district || undefined,
          });
        } else {
          setComplexImages({});
        }
      } catch (error) {
        console.error('이미지 로드 실패:', error);
        setComplexImages({});
      }
    };

    loadImages();
  }, [selectedComplex]);

  // 진행율 상세 정보 로드
  useEffect(() => {
    const loadProgressDetails = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/progress/details/${selectedComplex}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.detailed_progress) {
            setServerDetailedProgress(data.detailed_progress);
          } else {
            setServerDetailedProgress(null);
          }
          if (data.timeline && Array.isArray(data.timeline)) {
            setServerTimeline(data.timeline);
          } else {
            setServerTimeline([]);
          }
        } else {
          setServerDetailedProgress(null);
          setServerTimeline([]);
        }
      } catch (error) {
        console.error('진행율 상세 정보 로드 실패:', error);
        setServerDetailedProgress(null);
        setServerTimeline([]);
      }
    };

    loadProgressDetails();

    // 진행율 업데이트 이벤트 리스너
    const handleProgressUpdate = () => {
      loadProgressDetails();
    };
    window.addEventListener('progressUpdated', handleProgressUpdate);
    window.addEventListener('timelineUpdated', handleProgressUpdate);

    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate);
      window.removeEventListener('timelineUpdated', handleProgressUpdate);
    };
  }, [selectedComplex]);

  const complex = filteredComplexes.find(c => c.id === selectedComplex) || filteredComplexes[0];

  // 서버에서 로드한 상세 정보가 있으면 그것을 사용, 없으면 기본값 사용
  const displayedDetailedProgress = serverDetailedProgress || complex.detailedProgress;
  const displayedTimeline = serverTimeline.length > 0 ? serverTimeline : complex.timeline;

  // 이미지 확대 핸들러
  const handleImageZoom = (src: string, title: string) => {
    setZoomedImage({ src, title });
    setImageZoomOpen(true);
  };

  // ProgressContext에서 진행율 가져오기 (없으면 기본값 사용)
  const getProgress = (complexId: string) => {
    return progressData[complexId] !== undefined ? progressData[complexId] : allComplexes.find(c => c.id === complexId)?.progress || 0;
  };

  // subDistricts에서 총 세대수 계산
  const calculateTotalHouseholds = (districts: any[], field: 'beforeHouseholds' | 'afterHouseholds'): string => {
    if (!districts || districts.length === 0) return '0가구';

    let total = 0;
    districts.forEach(district => {
      const value = district[field];
      if (value) {
        // "3,569가구" 또는 "포함" 같은 형식 처리
        if (value === '포함' || value === '-') {
          return; // 계산에서 제외
        }
        // 숫자만 추출 (쉼표 제거)
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers) {
          total += parseInt(numbers, 10);
        }
      }
    });

    // 1000단위 쉼표 추가
    return total.toLocaleString() + '가구';
  };

  // 총 세대수: 서버 값 우선, 없으면 계산, 둘 다 없으면 기본값
  const totalHouseholdsBefore = serverTotalHouseholdsBefore
    ? serverTotalHouseholdsBefore
    : (subDistricts.length > 0
        ? calculateTotalHouseholds(subDistricts, 'beforeHouseholds')
        : complex.householdsBefore);

  const totalHouseholdsAfter = serverTotalHouseholdsAfter
    ? serverTotalHouseholdsAfter
    : (subDistricts.length > 0
        ? calculateTotalHouseholds(subDistricts, 'afterHouseholds')
        : complex.householdsAfter);

  // 서버에서 추가 정보 로드
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal,
        });
        return res.ok ? res : null;
      } catch {
        return null;
      }
    };

    const fetchExtraData = async () => {
      setIsLoadingExtraData(true);
      try {
        // 학군 정보 로드
        const schoolResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/school-info?complex_id=${selectedComplex}`
        );
        
        if (schoolResponse) {
          const schoolData = await schoolResponse.json();
          if (schoolData.schools) {
            if (typeof schoolData.schools === 'object' && !Array.isArray(schoolData.schools)) {
              setSchoolInfo(schoolData.schools.schools?.map((s: any) => s.name || s) || []);
              setStudentProjection(schoolData.schools.studentProjection || "");
            } else {
              setSchoolInfo(schoolData.schools.map((s: any) => s.name || s));
              setStudentProjection("");
            }
          } else {
            setSchoolInfo(complex.nearbySchools);
            setStudentProjection(complex.studentProjection || "");
          }
        } else {
          setSchoolInfo(complex.nearbySchools);
          setStudentProjection(complex.studentProjection || "");
        }

        // 교통 정보 로드
        const transportResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/transport-info?complex_id=${selectedComplex}`
        );

        if (transportResponse) {
          const transportData = await transportResponse.json();
          if (transportData.transport_info) {
            if (typeof transportData.transport_info === 'object') {
              setTransportInfo(transportData.transport_info.info || complex.transportInfo);
              setTransportImprovementNote(transportData.transport_info.improvementNote || "정비사업 완료 시 교통 여건이 크게 개선될 것으로 예상됩니다.");
            } else {
              setTransportInfo(transportData.transport_info);
              setTransportImprovementNote("정비사업 완료 시 교통 여건이 크게 개선될 것으로 예상됩니다.");
            }
          } else {
            setTransportInfo(complex.transportInfo);
            setTransportImprovementNote("정비사업 완료 시 교통 여건이 크게 개선될 것으로 예상됩니다.");
          }
        } else {
          setTransportInfo(complex.transportInfo);
          setTransportImprovementNote("정비사업 완료 시 교통 여건이 크게 개선될 것으로 예상됩니다.");
        }

        // 비고 정보 로드
        const notesResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/notes?complex_id=${selectedComplex}`
        );

        if (notesResponse) {
          const notesData = await notesResponse.json();
          setNotes(notesData.notes || complex.notes);
        } else {
          setNotes(complex.notes);
        }

        // 용적률/건폐율 정보 로드
        const ratioResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/floor-area-ratio?complex_id=${selectedComplex}`
        );

        if (ratioResponse) {
          const ratioData = await ratioResponse.json();
          setFloorAreaRatio(ratioData.floor_area_ratio || complex.floorAreaRatio);
          setBuildingCoverageRatio(ratioData.building_coverage_ratio || complex.buildingCoverageRatio || "-");
        } else {
          setFloorAreaRatio(complex.floorAreaRatio);
          setBuildingCoverageRatio(complex.buildingCoverageRatio || "-");
        }

        // 주차 정보 로드
        const parkingResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/parking`
        );

        if (parkingResponse) {
          const parkingData = await parkingResponse.json();
          const parkingItem = parkingData.find((item: any) => item.complex_id === selectedComplex);
          if (parkingItem) {
            setParkingBefore(parkingItem.parking_before);
            setParkingAfter(parkingItem.parking_after);
          } else {
            setParkingBefore(complex.parkingBefore);
            setParkingAfter(complex.parkingAfter);
          }
        } else {
          setParkingBefore(complex.parkingBefore);
          setParkingAfter(complex.parkingAfter);
        }

        // 층수 정보 로드
        const floorsResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/floors`
        );

        if (floorsResponse) {
          const floorsData = await floorsResponse.json();
          const floorsItem = floorsData.find((item: any) => item.complex_id === selectedComplex);
          setMaxFloors(floorsItem ? floorsItem.max_floors : complex.maxFloors);
        } else {
          setMaxFloors(complex.maxFloors);
        }

        // 기본정보 로드
        const basicInfoResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/basic-info`
        );

        if (basicInfoResponse) {
          const basicInfoData = await basicInfoResponse.json();
          const basicInfoItem = basicInfoData.find((item: any) => item.complex_id === selectedComplex);
          if (basicInfoItem && basicInfoItem.subDistricts) {
            setSubDistricts(basicInfoItem.subDistricts);
            setServerTotalHouseholdsBefore(basicInfoItem.total_households_before || "");
            setServerTotalHouseholdsAfter(basicInfoItem.total_households_after || "");
          } else {
            setSubDistricts(complex.subDistricts || []);
            setServerTotalHouseholdsBefore("");
            setServerTotalHouseholdsAfter("");
          }
        } else {
          setSubDistricts(complex.subDistricts || []);
          setServerTotalHouseholdsBefore("");
          setServerTotalHouseholdsAfter("");
        }

        // 분담금 안내 내용 로드
        const guideResponse = await safeFetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/contribution-guide`
        );

        if (guideResponse) {
          const guideData = await guideResponse.json();
          if (guideData.content) {
            setContributionGuide(guideData.content);
          }
        }
      } catch {
        // abort 등 예외 시 기본값 유지 (이미 safeFetch에서 처리됨)
      } finally {
        if (!signal.aborted) {
          setIsLoadingExtraData(false);
        }
      }
    };

    fetchExtraData();
    return () => controller.abort();
  }, [selectedComplex]);

  // 단지 목록 로딩 중일 때
  if (isLoadingComplexes) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">단지 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>{categoryName} - 정비사업 현황 | 성남시 개발 톡톡</title>
        <meta name="description" content={`${categoryName} 단지 및 구역별 진행률, 분담금, 학군, 교통 정보를 한눈에 확인하세요`} />
        <link rel="canonical" href={`${window.location.origin}/dashboard${id ? `/${id}` : ''}`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
            {categoryName}
          </h1>
          <p className="text-gray-600">단지 및 구역별 맞춤 정보를 한눈에 확인하세요</p>
        </div>

        {/* 2차 특별정비구역 안내 배너 - 분당 재건축 카테고리에서만 표시 */}
        {category === 'bundang' && (
          <Card className="mb-6 bg-blue-50 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSpecialDistrictDialogOpen(true)}>
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                📅 <strong>2026년 7월 2차 특별정비구역 지정 관련 안내</strong> (2차 특별정비구역 상세 정보 보기)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Complex Selector */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  단지 및 구역 선택
                </label>
                <Select value={selectedComplex} onValueChange={setSelectedComplex}>
                  <SelectTrigger className="w-full md:w-64 text-white border-blue-500 hover:bg-blue-500 [&>svg]:text-white bg-blue-600">
                    <SelectValue placeholder="단지 및 구역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredComplexes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">진행률</p>
                <p
                  className="text-3xl font-bold transition-colors duration-500"
                  style={{
                    color: getProgress(selectedComplex) <= 30 ? '#dc2626' :
                           getProgress(selectedComplex) <= 60 ? '#f59e0b' :
                           getProgress(selectedComplex) <= 80 ? '#84cc16' :
                           '#22c55e',
                    textShadow: '0 1px 1px rgba(0,0,0,0.25), 0 1px 1px rgba(0,0,0,0.15)',
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                  }}
                >
                  {getProgress(selectedComplex)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
         {/* 세대수 카드 - 클릭 가능 */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => subDistricts.length > 0 && setHouseholdsDialogOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-600 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  기본 정보
                </span>
                {subDistricts.length > 0 && (
                  <Info className="w-10 h-10 text-blue-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{totalHouseholdsBefore} → {totalHouseholdsAfter}</p>
              <p className="text-xs text-gray-500 mt-2">세대정보</p>
              {subDistricts.length > 0 && (
                <p className="text-sm text-blue-600 mt-2 font-bold">(단지 및 구역 기본 정보 상세보기)</p>
              )}
            </CardContent>
          </Card>
          
          {/* 진행 카드 - 클릭 가능 */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => displayedDetailedProgress && setProgressDialogOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-600 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  진행률
                </span>
                {displayedDetailedProgress && (
                  <Info className="w-10 h-10 text-blue-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className="text-2xl font-bold mb-2 transition-colors duration-500"
                style={{
                  color: getProgress(selectedComplex) <= 30 ? '#dc2626' :
                         getProgress(selectedComplex) <= 60 ? '#f59e0b' :
                         getProgress(selectedComplex) <= 80 ? '#84cc16' :
                         '#22c55e',
                  textShadow: '0 1px 1px rgba(0,0,0,0.2)',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                }}
              >
                {getProgress(selectedComplex)}%
              </p>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${getProgress(selectedComplex)}%`,
                    background: `linear-gradient(90deg,
                      ${getProgress(selectedComplex) <= 30 ? '#dc2626, #ef4444' :
                        getProgress(selectedComplex) <= 60 ? '#f59e0b, #fbbf24' :
                        getProgress(selectedComplex) <= 80 ? '#84cc16, #a3e635' :
                        '#22c55e, #4ade80'
                      })`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{complex.status}</p>
              {displayedDetailedProgress && (
                <p className="text-sm text-blue-600 mt-2 font-bold">(진행률 상세 정보 보기)</p>
              )}
            </CardContent>
          </Card>        

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setContributionDialogOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-600 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 inline-flex items-center justify-center text-sm font-bold">₩</span>
                  분담금 개념
                </span>
                <Info className="w-10 h-10 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {contributionFromContext[selectedComplex] || complex.avgContribution31py}
              </p>
              <p className="text-xs text-gray-500 mt-2">관리처분계획인가 이전: 종전/종후 자산 평가를 통해 개별 분담금 최종 확정</p>
              <p className="text-sm text-blue-600 mt-2 font-bold">(분담금 안내 상세보기)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <Car className="w-4 h-4" />
                주차 개선
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{parkingBefore || complex.parkingBefore} → {parkingAfter || complex.parkingAfter}</p>
              <p className="text-xs text-gray-500 mt-2">세대당 대수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                예상 층수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{maxFloors || complex.maxFloors}</p>
              <p className="text-xs text-gray-500 mt-2">최고 층수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                용적률/건폐율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{floorAreaRatio || complex.floorAreaRatio}</p>
              <p className="text-xs text-gray-500 mt-1">용적률</p>
              <p className="text-lg font-bold text-blue-600 mt-2">{buildingCoverageRatio}</p>
              <p className="text-xs text-gray-500 mt-1">건폐율</p>
            </CardContent>
          </Card>
        </div>

        {/* 조감도/배치도/구역계 이미지 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 조감도 */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">조감도</CardTitle>
            </CardHeader>
            <CardContent>
              {complexImages.aerial ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {complexImages.aerial.startsWith('data:application/pdf') ? (
                    <div className="bg-gray-100 p-8 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">PDF 파일</p>
                      <a
                        href={complexImages.aerial}
                        download="조감도.pdf"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        다운로드
                      </a>
                    </div>
                  ) : (
                    <img
                      src={complexImages.aerial}
                      alt="조감도"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-64 object-contain bg-gray-50 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleImageZoom(complexImages.aerial!, "조감도")}
                    />
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">조감도는 준비 중 입니다.</p>
                  <p className="text-xs text-gray-500">조감도가 완료 되면 업로드 됩니다.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 배치도 */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">배치도</CardTitle>
            </CardHeader>
            <CardContent>
              {complexImages.layout ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {complexImages.layout.startsWith('data:application/pdf') ? (
                    <div className="bg-gray-100 p-8 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">PDF 파일</p>
                      <a
                        href={complexImages.layout}
                        download="배치도.pdf"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        다운로드
                      </a>
                    </div>
                  ) : (
                    <img
                      src={complexImages.layout}
                      alt="배치도"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-64 object-contain bg-gray-50 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleImageZoom(complexImages.layout!, "배치도")}
                    />
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">배치도가 준비 중입니다.</p>
                  <p className="text-xs text-gray-500">배치도가 완료 되면 업로드 됩니다.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 구역계 */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">구역계</CardTitle>
            </CardHeader>
            <CardContent>
              {complexImages.district ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {complexImages.district.startsWith('data:application/pdf') ? (
                    <div className="bg-gray-100 p-8 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">PDF 파일</p>
                      <a
                        href={complexImages.district}
                        download="구역계.pdf"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        다운로드
                      </a>
                    </div>
                  ) : (
                    <img
                      src={complexImages.district}
                      alt="구역계"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-64 object-contain bg-gray-50 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleImageZoom(complexImages.district!, "구역계")}
                    />
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">구역계가 준비 중입니다.</p>
                  <p className="text-xs text-gray-500">구역계가 완료 되면 업로드 됩니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">{complex.name} 추진일정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedTimeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'ongoing' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-900 text-sm">{item.event}</p>
                      <Badge variant={
                        item.status === 'completed' ? 'default' :
                        item.status === 'ongoing' ? 'secondary' :
                        'outline'
                      }>
                        {item.status === 'completed' ? '완  료' :
                         item.status === 'ongoing' ? '진행중' :
                         '예  정'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">주변 학군 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {schoolInfo.map((school, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>{school}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">학령인구 {studentProjection}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-bold">교통 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{transportInfo}</p>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {transportImprovementNote}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>비고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-gray-800">{notes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 진행률 상세 Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex items-center gap-2">
               <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                <span>{complex.name}</span>
             </div>
                <span className="w-full self-start pl-7 text-left sm:w-auto sm:pl-0">진행율 현황 및 일정</span>
             </DialogTitle>
          <DialogDescription>
            실시간 재건축 진행 상황과 향후 예정 일정
      </DialogDescription>
    </DialogHeader>
          {displayedDetailedProgress && (
            <div className="space-y-4">
              
              {/* 현재 진행 상황 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  현재 진행 상황
                </h4>
                <p className="text-gray-800">{displayedDetailedProgress.currentStatus}</p>
              </div>

              {/* 주요 일정 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">다음 마일스톤</p>
                  <p className="text-sm font-bold text-blue-600">
                    {displayedDetailedProgress.nextMilestone}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">예상 착공</p>
                  <p className="text-sm font-bold text-green-600">
                    {displayedDetailedProgress.expectedConstruction}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">입주 예상</p>
                  <p className="text-sm font-bold text-purple-600">
                    {displayedDetailedProgress.expectedMoveIn}
                  </p>
                </div>
              </div>

              {/* 타임라인 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">상세 일정</h4>
                <div className="space-y-3">
                  {displayedTimeline.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'ongoing' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 text-sm">{item.event}</p>
                          <Badge variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'ongoing' ? 'secondary' :
                            'outline'
                          }>
                            {item.status === 'completed' ? '완료' :
                             item.status === 'ongoing' ? '진행중' :
                             '예정'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  ⚠️ 일정은 변동될 수 있으며, 정확한 정보는 조합 공지사항을 확인해주세요.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 세대 상세 Dialog */}
      <Dialog open={householdsDialogOpen} onOpenChange={setHouseholdsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-auto scrollbar-hide">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-left">
              <Home className="w-5 h-5 text-blue-600" />
              {complex.name} 세부 구역 정보
            </DialogTitle>
            <DialogDescription className="text-left">
              대형 구역별 세대수 현황
            </DialogDescription>
          </DialogHeader>
          {subDistricts.length > 0 && (
            <div className="space-y-4">
              {/* 테이블 - 가로 스크롤 가능 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">대형 구역</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">세부 구역</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">위치</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">면적</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">용도지역</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">총 사업비</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">사업방식</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">시공사</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">기존 세대</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">계획 세대</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subDistricts.map((district, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">{district.largeName}</td>
                        <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{district.subName}</td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{district.location}</td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{district.area}</td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{district.zoning}</td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{district.totalBudget}</td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{district.projectMethod}</td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{district.constructor}</td>
                        <td className="py-3 px-3 text-right font-semibold text-blue-600 whitespace-nowrap">
                          {district.beforeHouseholds}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-green-600 whitespace-nowrap">
                          {district.afterHouseholds}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 요약 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">기존 총 세대수</p>
                  <p className="text-2xl font-bold text-blue-600">{totalHouseholdsBefore}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">계획 총 세대수</p>
                  <p className="text-2xl font-bold text-green-600">{totalHouseholdsAfter}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  ⚠️ 세대수는 최종 사업계획에 따라 변동될 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 분담금 안내 Dialog */}
      <Dialog open={contributionDialogOpen} onOpenChange={setContributionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Currency className="w-5 h-5 text-green-600" />
              분담금 안내
            </DialogTitle>
            <DialogDescription>
              재건축·재개발 분담금 개념과 계산방식을 알아보세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto scrollbar-hide pr-2">
            {/* 1. 기본 개념 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                1. 기본 개념: 분담금이란?
              </h3>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-base text-gray-900 mb-3 whitespace-pre-line">
                  {contributionGuide?.basicConcept || '분담금 = "새 아파트(혹은 새 주택)를 받기 위해, 종전자산을 제외하고 직접 더 내야 하는 금액"\n\n예:\n• 종전자산 10억 원\n• 새 분양가 12억 원\n→ 12억 - 10억 = 2억 원 → 이것이 분담금입니다.'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">이를 수식으로 정리하면 아래와 같습니다.</p>
                <div className="bg-white p-3 rounded border border-gray-300 font-mono text-sm whitespace-pre-line">
                  {contributionGuide?.formula || '분담금 = 조합원 분양가액 - 조합원 권리가액\n\n여기서\n조합원 권리가액 = 종전자산 감정평가액 × 비례율\n비례율 = (종후 총 자산평가액 - 총 사업비) / 종전 총 자산평가액 × 100%'}
                </div>
              </div>
            </div>

            {/* 2. 실무에서 쓰는 두 가지 계산 방식 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                2. 실무에서 쓰는 두 가지 계산 방식
              </h3>
              <p className="text-sm text-gray-700">재건축·재개발에서는 두 가지 공식을 모두 쓰며, 결과는 비슷하게 나옵니다.</p>

              {/* 방식 1 */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-3">{contributionGuide?.method1Title || '① 분담금 = 조합원 분양가액 - 권리가액'}</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line mb-3">
                  {contributionGuide?.method1Content || '• 조합원 분양가액: 조합원에게 배정될 세대(평형)에 해당하는 분양가 (예: 12억 원/세대)\n• 조합원 권리가액:\n  - 종전자산 감정평가액 × 비례율\n  - 비례율 = (수입 총액 - 정비사업비 총액) / 종전가격 총액 × 100%'}
                </div>
                <div className="bg-purple-100 p-3 rounded mt-3">
                  <p className="text-sm font-semibold text-gray-900 mb-2">예시:</p>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {contributionGuide?.method1Example || '종전자산 10억 원\n비례율 110%\n조합원 분양가 12억 원\n\n조합원 권리가액 = 10억 × 110% = 11억\n분담금 = 12억 - 11억 = 1억\n\n→ 분담금 약 1억 원 (11억은 이미 "종전자산+비례율"로 받는 권리, 1억은 추가로 내는 것)'}
                  </div>
                </div>
              </div>

              {/* 방식 2 */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-bold text-gray-900 mb-3">{contributionGuide?.method2Title || '② 분담금 = 조합원 건축원가 - 일반분양 기여금'}</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line mb-3">
                  {contributionGuide?.method2Content || '조합·설계·사업성 분석 쪽에서 많이 쓰는 방식입니다.\n\n조합원 건축원가:\n• 순수건축비 + 기타사업비\n• 순수건축비 = 평당 건축비 × 계약면적(평수)\n• 기타사업비 = 순수건축비 × 약 30% 정도 (보상·용역·공공기여·금융 등)\n\n일반분양 기여 금액:\n일반분양이 가져가는 대지지분에 해당하는 일반분양 1평당 수익 × 일반분양 기여 대지지분으로 계산'}
                </div>
                <div className="bg-orange-100 p-3 rounded mt-3">
                  <p className="text-sm font-semibold text-gray-900 mb-2">예시:</p>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {contributionGuide?.method2Example || '조합원 건축원가: 3.5억\n일반분양 기여금: 2억\n\n분담금 = 3.5억 - 2억 = 1.5억'}
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>참고)</strong> {contributionGuide?.method2Note || '도시계획이 잘 되어 건축 설계 시 자재와 세대 공간 구성이 좋아, 분양가가 높고 일반분양이 많으면, 일반분양 기여금이 늘어나, 조합원 분담금이 줄어들 수 있습니다.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ 본 내용은 일반적인 분담금 계산 방식을 설명한 것이며, 실제 분담금은 조합 총회 및 사업 진행 상황에 따라 달라질 수 있습니다. 정확한 정보는 각 단지 조합에 문의하시기 바랍니다.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 이미지 확대 Dialog */}
      <Dialog open={imageZoomOpen} onOpenChange={setImageZoomOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle>{zoomedImage?.title || '이미지 보기'}</DialogTitle>
            <DialogDescription>
              이미지를 크게 보실 수 있습니다
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {zoomedImage && (
              <img
                src={zoomedImage.src}
                alt={zoomedImage.title}
                loading="eager"
                decoding="async"
                className="w-full h-auto max-h-[75vh] object-contain bg-gray-50 rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2차 특별정비구역 지정 안내 Dialog */}
      <Dialog open={specialDistrictDialogOpen} onOpenChange={setSpecialDistrictDialogOpen}>
        <DialogContent className="w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl pr-8">
              {bannerContent?.title || "2026년 7월 2차 특별정비구역 지정 관련 안내"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {bannerContent?.subtitle || "연도별·분기별 흐름 + 중요 서류·동의문·선정 시점"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {bannerContent && bannerContent.years && bannerContent.years.length > 0 ? (
              // 서버에서 로드한 데이터 표시
              <>
                {bannerContent.years.map((yearData: any, yearIndex: number) => (
                  <div key={yearIndex}>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-blue-600" />
                      {yearData.year}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 min-w-[800px]">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">연도/분기</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">주요 진행사항</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">중요 서류·동의문·절차</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">설계·정비·시공 업체 등</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearData.quarters && yearData.quarters.map((quarter: any, qIndex: number) => (
                            <tr key={qIndex} className={qIndex % 2 === 1 ? "bg-gray-50" : ""}>
                              <td className="border border-gray-300 px-4 py-3 font-medium">{quarter.quarter}</td>
                              <td className="border border-gray-300 px-4 py-3">{quarter.mainProgress}</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm whitespace-pre-line">
                                {quarter.documents}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm whitespace-pre-line">
                                {quarter.companies}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* 설계·업체 선정 시점 요약 */}
                {(bannerContent.designSummary || bannerContent.constructionSummary) && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      "설계·업체 선정 시점" 요약
                    </h3>

                    <div className="space-y-4">
                      {bannerContent.designSummary && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">설계 (정비·건축·도시계획)</h4>
                          <div className="text-sm text-gray-700 whitespace-pre-line">
                            {bannerContent.designSummary}
                          </div>
                        </div>
                      )}

                      {bannerContent.constructionSummary && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">시공사 (건설사)</h4>
                          <div className="text-sm text-gray-700 whitespace-pre-line">
                            {bannerContent.constructionSummary}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
