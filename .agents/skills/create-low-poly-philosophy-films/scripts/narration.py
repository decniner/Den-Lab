import hashlib,json

def active_word(scene,absolute_time):
    relative=absolute_time-scene['start']
    return next((w['text'] for w in scene['words'] if w['t']<=relative<w['t']+w['dur']),None)

def speech_key(row,model_digest,reference_digest,seed):
    payload={'engine':'chatterbox-tts-0.1.7-turbo','speaker':row['who'],'text':row['text'],'model':model_digest,'reference':reference_digest,'seed':seed,'schema':1}
    return hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()

def file_digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        while chunk:=f.read(1024*1024):h.update(chunk)
    return h.hexdigest()
