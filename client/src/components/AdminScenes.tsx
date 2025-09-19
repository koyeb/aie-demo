import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { clientApi } from '@/services/clientApi';
import type { Scene } from '@/types/schema';

export function AdminScenes() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [approvingScenes, setApprovingScenes] = useState<Set<number>>(new Set());

  // Load scenes on component mount
  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const scenesData = await clientApi.admin.getScenes();
      setScenes(scenesData);
    } catch (error) {
      console.error('Failed to load scenes:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load scenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveScene = async (sceneId: number) => {
    setApprovingScenes(prev => new Set(prev).add(sceneId));

    try {
      const result = await clientApi.admin.approveScene(sceneId.toString());

      if (result.success) {
        // Refresh the scenes list to get updated data
        await loadScenes();
      } else {
        setErrorMessage(result.message || 'Failed to approve scene');
      }
    } catch (error) {
      console.error('Failed to approve scene:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to approve scene');
    } finally {
      setApprovingScenes(prev => {
        const newSet = new Set(prev);
        newSet.delete(sceneId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-lg">
          <LoadingSpinner size="lg" className="text-blue-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Loading Scenes
          </h2>
          <p className="text-gray-600 text-center">
            Please wait while we fetch the scenes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin - Scene Management
              </h1>
              <p className="text-gray-600">
                Review and approve user-submitted scenes
              </p>
            </div>
            <Link to="/">
              <Button variant="outline">
                ← Back to Main App
              </Button>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Scenes grid */}
        {scenes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground text-lg">No scenes found.</p>
              <Button
                className="mt-4"
                onClick={loadScenes}
                variant="outline"
              >
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scenes.map((scene) => (
              <Card key={scene.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">
                      {scene.name}
                    </CardTitle>
                    <Badge variant={scene.result ? 'default' : 'secondary'}>
                      {scene.result ? 'processed' : 'pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {scene.email}
                  </p>
                  {scene.description && (
                    <p className="text-sm text-muted-foreground">
                      {scene.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Before Image */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-700">
                      Before (Original)
                    </h4>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={scene.fpath}
                        alt={`Original photo by ${scene.name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </div>
                  </div>

                  {/* After Image */}
                  {scene.result && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-gray-700">
                        After (Processed)
                      </h4>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={scene.result}
                          alt={`Processed photo by ${scene.name}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Edit Prompt */}
                  {scene.edit_prompt && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-gray-700">
                        Edit Prompt
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {scene.edit_prompt}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground">
                    <p>Created: {new Date(scene.created_at).toLocaleDateString()}</p>
                    <p>Modified: {new Date(scene.modified_at).toLocaleDateString()}</p>
                  </div>

                  {/* Actions */}
                  {scene.result != "" && (
                    <Button
                      onClick={() => handleApproveScene(scene.id)}
                      disabled={approvingScenes.has(scene.id)}
                      className="w-full"
                    >
                      {approvingScenes.has(scene.id) ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Approving...
                        </>
                      ) : (
                        'Approve Scene'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refresh button at the bottom */}
        <div className="mt-8 text-center">
          <Button
            onClick={loadScenes}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Refresh Scenes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
