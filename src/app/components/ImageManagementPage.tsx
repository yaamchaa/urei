import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useComplexList } from "../hooks/useComplexList";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Building2, Layers, MapPin, Upload, Trash2, AlertCircle, Image as ImageIcon, FileText } from "lucide-react";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { useUser } from "../contexts/UserContext";
import { getCsrfToken } from "../utils/csrf";

interface ImageData {
  aerial?: string;      // 조감도
  layout?: string;      // 배치도
  district?: string;    // 구역계
}

export function ImageManagementPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'bundang';
  
  // Category name mapping
  const getCategoryNameLocal = (cat: string): string => {
    const categoryNames: Record<string, string> = {
      'bundang': '분당 재건축',
      'oldtown-redevelopment': '원도심 재개발',
      'oldtown-reconstruction': '원도심 재건축',
      'garohousing': '가로주택정비사업',
    };
    return categoryNames[cat] || cat;
  };
  
  const categoryName = getCategoryNameLocal(category);
  const { complexList: complexes } = useComplexList(category);
  const { user } = useUser();
  const [selectedComplexId, setSelectedComplexId] = useState(complexes[0]?.id || '');
  const [images, setImages] = useState<ImageData>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 선택된 단지 정보
  const selectedComplex = complexes.find(c => c.id === selectedComplexId) || complexes[0];

  // complexes가 로드된 후 첫 번째 단지 자동 선택
  useEffect(() => {
    if (complexes.length > 0 && !selectedComplexId) {
      setSelectedComplexId(complexes[0].id);
    }
  }, [complexes, selectedComplexId]);

  // 이미지 로드
  useEffect(() => {
    if (selectedComplexId) {
      loadImages();
    }
  }, [selectedComplexId]);

  const loadImages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/images/${selectedComplexId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setImages({
          aerial: data.images?.aerial || undefined,
          layout: data.images?.layout || undefined,
          district: data.images?.district || undefined,
        });
      } else {
        setImages({});
      }
    } catch (error) {
      console.error('이미지 로드 실패:', error);
      setImages({});
    }
  };

  const handleImageUpload = async (type: 'aerial' | 'layout' | 'district', file: File) => {
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '❌ 파일 크기는 5MB 이하여야 합니다.' });
      return;
    }

    // 파일 타입 체크
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: '❌ JPG, PNG 또는 PDF 파일만 업로드 가능합니다.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;

      try {
        // 서버에 업로드
        const csrfToken = getCsrfToken();
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/images/upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
              'X-CSRF-Token': csrfToken || '',
            },
            body: JSON.stringify({
              complex_id: selectedComplexId,
              image_type: type,
              image_data: result,
              file_type: file.type,
              adminId: user?.id, // 🔒 관리자 ID 전달 (로그 기록용)
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          // 업로드 성공 후 이미지 URL을 상태에 저장
          const newImages = { ...images, [type]: data.data.signed_url };
          setImages(newImages);
          setMessage({ type: 'success', text: '✅ 이미지가 저장되었습니다.' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          const errorData = await response.text();
          console.error('서버 업로드 실패:', errorData);
          setMessage({ type: 'error', text: '❌ 저장 중 오류가 발생했습니다.' });
        }
      } catch (error) {
        console.error('저장 실패:', error);
        setMessage({ type: 'error', text: '❌ 저장 중 오류가 발생했습니다.' });
      }
    };

    reader.readAsDataURL(file);
  };

  const handleImageDelete = async (type: 'aerial' | 'layout' | 'district') => {
    if (!window.confirm('이미지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      // 서버에서 삭제
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-66444bd0/images/${selectedComplexId}/${type}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const newImages = { ...images };
        delete newImages[type];
        setImages(newImages);
        setMessage({ type: 'success', text: '✅ 이미지가 삭제되었습니다.' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.text();
        console.error('서버 삭제 실패:', errorData);
        setMessage({ type: 'error', text: '❌ 삭제 중 오류가 발생했습니다.' });
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      setMessage({ type: 'error', text: '❌ 삭제 중 오류가 발생했습니다.' });
    }
  };

  const imageTypes = [
    {
      key: 'aerial' as const,
      title: '조감도',
      icon: Building2,
      description: '단지 전체 조감도 이미지'
    },
    {
      key: 'layout' as const,
      title: '배치도',
      icon: Layers,
      description: '단지 배치도 이미지'
    },
    {
      key: 'district' as const,
      title: '구역계',
      icon: MapPin,
      description: '단지 구역계 이미지'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>{categoryName} 조감도/배치도/구역계 관리 | 성남시 개발 톡톡</title>
        <meta name="description" content="각 단지의 조감도, 배치도, 구역계 이미지를 관리하세요" />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-blue-600" />
            {categoryName} 조감도/배치도/구역계 관리
          </h1>
          <p className="text-gray-600">
            각 단지의 조감도, 배치도, 구역계 이미지를 업로드하고 관리할 수 있습니다.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">관리자 안내</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 단지를 선택하여 해당 단지의 이미지를 업로드할 수 있습니다.</li>
                  <li>• JPG, PNG 또는 PDF 파일을 업로드할 수 있습니다. (최대 5MB)</li>
                  <li>• 업로드된 이미지는 대시보드 페이지에 즉시 반영됩니다.</li>
                  <li>• 이미지를 삭제하면 대시보드에서도 제거됩니다.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complex Selector */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관리할 단지 선택
            </label>
            <Select value={selectedComplexId} onValueChange={setSelectedComplexId}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {complexes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Message Display */}
        {message && (
          <Card className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="py-4">
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Image Upload Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {imageTypes.map((imageType) => {
            const Icon = imageType.icon;
            const currentImage = images[imageType.key];

            return (
              <Card key={imageType.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    {imageType.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{imageType.description}</p>
                </CardHeader>
                <CardContent>
                  {currentImage ? (
                    <div className="space-y-4">
                      {/* 이미지 미리보기 */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {currentImage.startsWith('data:application/pdf') ? (
                          <div className="bg-gray-100 p-8 text-center">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">PDF 파일</p>
                          </div>
                        ) : (
                          <img
                            src={currentImage}
                            alt={imageType.title}
                            className="w-full h-64 object-contain bg-gray-50"
                          />
                        )}
                      </div>

                      {/* 삭제 버튼 */}
                      <Button
                        onClick={() => handleImageDelete(imageType.key)}
                        variant="destructive"
                        className="w-full gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        이미지 삭제
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 mb-2">클릭하여 파일 선택</p>
                          <p className="text-xs text-gray-500">JPG, PNG 또는 PDF (최대 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(imageType.key, file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 안내 카드 */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-800">
              💡 업로드된 이미지는 서버에 안전하게 저장되어 모든 브라우저와 기기에서 접근할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
